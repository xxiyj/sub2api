//go:build unit

package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

type updateServiceCacheStub struct {
	data string
}

func (s *updateServiceCacheStub) GetUpdateInfo(context.Context) (string, error) {
	if s.data == "" {
		return "", errors.New("cache miss")
	}
	return s.data, nil
}

func (s *updateServiceCacheStub) SetUpdateInfo(_ context.Context, data string, _ time.Duration) error {
	s.data = data
	return nil
}

type updateServiceGitHubClientStub struct {
	release        *GitHubRelease
	recentReleases []*GitHubRelease
	recentErr      error
}

func (s *updateServiceGitHubClientStub) FetchLatestRelease(context.Context, string) (*GitHubRelease, error) {
	return s.release, nil
}

func (s *updateServiceGitHubClientStub) FetchRecentReleases(context.Context, string, int) ([]*GitHubRelease, error) {
	if s.recentErr != nil || s.recentReleases != nil {
		return s.recentReleases, s.recentErr
	}
	if s.release != nil {
		return []*GitHubRelease{s.release}, nil
	}
	return s.recentReleases, s.recentErr
}

func (s *updateServiceGitHubClientStub) DownloadFile(context.Context, string, string, int64) error {
	panic("DownloadFile should not be called when no update is available")
}

func (s *updateServiceGitHubClientStub) FetchChecksumFile(context.Context, string) ([]byte, error) {
	panic("FetchChecksumFile should not be called when no update is available")
}

func TestUpdateServicePerformUpdateNoUpdateReturnsSentinel(t *testing.T) {
	svc := NewUpdateService(
		&updateServiceCacheStub{},
		&updateServiceGitHubClientStub{
			release: &GitHubRelease{
				TagName: "custom-v0.1.132-1",
				Name:    "custom-v0.1.132-1",
			},
		},
		"0.1.132-1",
		"release",
	)

	err := svc.PerformUpdate(context.Background())

	require.Error(t, err)
	require.True(t, errors.Is(err, ErrNoUpdateAvailable))
	require.ErrorIs(t, err, ErrNoUpdateAvailable)
}

func TestCompareVersionsSupportsCustomTemplateRevisions(t *testing.T) {
	require.Equal(t, 0, compareVersions("0.1.143-2", "custom-v0.1.143-2"))
	require.Equal(t, -1, compareVersions("0.1.143-2", "0.1.143-3"))
	require.Equal(t, 1, compareVersions("0.1.143-2", "0.1.143"))
	require.Equal(t, 1, compareVersions("0.1.144-1", "0.1.143-9"))
}

func TestFetchLatestReleaseUsesCustomReleaseTagsOnly(t *testing.T) {
	svc := NewUpdateService(
		&updateServiceCacheStub{},
		&updateServiceGitHubClientStub{
			recentReleases: []*GitHubRelease{
				{TagName: "v0.1.200", Name: "official release"},
				{TagName: "custom-v0.1.143-3", Name: "custom release"},
			},
		},
		"0.1.143-2",
		"release",
	)

	info, err := svc.CheckUpdate(context.Background(), true)

	require.NoError(t, err)
	require.Equal(t, "0.1.143-3", info.LatestVersion)
	require.True(t, info.HasUpdate)
	require.Equal(t, "custom release", info.ReleaseInfo.Name)
}

func TestFetchLatestReleasePrefersGitHubLatestCustomRelease(t *testing.T) {
	svc := NewUpdateService(
		&updateServiceCacheStub{},
		&updateServiceGitHubClientStub{
			release: &GitHubRelease{
				TagName: "custom-v0.1.144-13",
				Name:    "latest custom release",
			},
			recentReleases: []*GitHubRelease{
				{TagName: "custom-v0.1.144-9", Name: "first listed custom release"},
				{TagName: "custom-v0.1.144-13", Name: "latest custom release"},
			},
		},
		"0.1.144-9",
		"release",
	)

	info, err := svc.CheckUpdate(context.Background(), true)

	require.NoError(t, err)
	require.Equal(t, "0.1.144-13", info.LatestVersion)
	require.True(t, info.HasUpdate)
	require.Equal(t, "latest custom release", info.ReleaseInfo.Name)
}

func TestMatchingUpdateAssetSupportsCustomBinaryNames(t *testing.T) {
	require.True(t, isMatchingUpdateAsset("sub2api-linux-amd64", []string{"sub2api-linux-amd64", "linux_amd64"}))
	require.True(t, isMatchingUpdateAsset("sub2api_linux_amd64.tar.gz", []string{"sub2api-linux-amd64", "linux_amd64"}))
	require.False(t, isMatchingUpdateAsset("checksums.txt", []string{"sub2api-linux-amd64", "linux_amd64"}))
}

func newRollbackTestService(current string, releases []*GitHubRelease) *UpdateService {
	return NewUpdateService(
		&updateServiceCacheStub{},
		&updateServiceGitHubClientStub{recentReleases: releases},
		current,
		"release",
	)
}

func TestUpdateServiceListRollbackVersionsFiltersAndCaps(t *testing.T) {
	releases := []*GitHubRelease{
		{TagName: "custom-v0.1.148-1", PublishedAt: "2026-07-09T00:00:00Z"},                   // newer than current: excluded
		{TagName: "custom-v0.1.147-2", PublishedAt: "2026-07-08T00:00:00Z"},                   // current: excluded
		{TagName: "custom-v0.1.147-1", PublishedAt: "2026-07-07T12:00:00Z", Prerelease: true}, // prerelease: excluded
		{TagName: "custom-v0.1.147-0", PublishedAt: "2026-07-07T00:00:00Z"},
		{TagName: "custom-v0.1.146-9", PublishedAt: "2026-07-06T00:00:00Z", Draft: true}, // draft: excluded
		{TagName: "v0.1.146", PublishedAt: "2026-07-05T12:00:00Z"},                       // non-custom release: excluded
		{TagName: "custom-v0.1.146-3", PublishedAt: "2026-07-05T00:00:00Z"},
		{TagName: "custom-v0.1.146-3", PublishedAt: "2026-07-05T00:00:00Z"}, // duplicate: excluded
		{TagName: "custom-v0.1.145-2", PublishedAt: "2026-07-04T00:00:00Z"},
		{TagName: "custom-v0.1.144-8", PublishedAt: "2026-07-03T00:00:00Z"}, // beyond cap of 3: excluded
	}
	svc := newRollbackTestService("0.1.147-2", releases)

	versions, err := svc.ListRollbackVersions(context.Background())

	require.NoError(t, err)
	require.Len(t, versions, 3)
	require.Equal(t, "0.1.147-0", versions[0].Version)
	require.Equal(t, "0.1.146-3", versions[1].Version)
	require.Equal(t, "0.1.145-2", versions[2].Version)
}

func TestUpdateServiceListRollbackVersionsSortsUnorderedInput(t *testing.T) {
	releases := []*GitHubRelease{
		{TagName: "custom-v0.1.146-9"},
		{TagName: "custom-v0.1.147-1"},
		{TagName: "custom-v0.1.146-12"},
	}
	svc := newRollbackTestService("0.1.147-2", releases)

	versions, err := svc.ListRollbackVersions(context.Background())

	require.NoError(t, err)
	require.Len(t, versions, 3)
	require.Equal(t, "0.1.147-1", versions[0].Version)
	require.Equal(t, "0.1.146-12", versions[1].Version)
	require.Equal(t, "0.1.146-9", versions[2].Version)
}

func TestUpdateServiceListRollbackVersionsEmptyWhenNoneOlder(t *testing.T) {
	releases := []*GitHubRelease{
		{TagName: "custom-v0.1.147-2"},
		{TagName: "custom-v0.1.148-1"},
		{TagName: "v0.1.146"},
	}
	svc := newRollbackTestService("0.1.147-2", releases)

	versions, err := svc.ListRollbackVersions(context.Background())

	require.NoError(t, err)
	require.Empty(t, versions)
}

func TestUpdateServiceListRollbackVersionsPropagatesFetchError(t *testing.T) {
	svc := NewUpdateService(
		&updateServiceCacheStub{},
		&updateServiceGitHubClientStub{recentErr: errors.New("github unavailable")},
		"0.1.147-2",
		"release",
	)

	_, err := svc.ListRollbackVersions(context.Background())

	require.Error(t, err)
	require.Contains(t, err.Error(), "github unavailable")
}

func TestUpdateServiceRollbackToVersionRejectsDisallowedTargets(t *testing.T) {
	releases := []*GitHubRelease{
		{TagName: "custom-v0.1.148-1"},
		{TagName: "custom-v0.1.147-2"},
		{TagName: "custom-v0.1.147-1"},
		{TagName: "custom-v0.1.146-3"},
		{TagName: "custom-v0.1.145-2"},
		{TagName: "custom-v0.1.144-8"},
		{TagName: "custom-v0.1.143-4"},
	}
	svc := newRollbackTestService("0.1.147-2", releases)

	for _, target := range []string{
		"",                  // empty
		"0.1.147-2",         // current version
		"custom-v0.1.147-2", // current version with custom prefix
		"0.1.148-1",         // newer than current
		"0.1.143-4",         // older than the 3 most recent
		"9.9.9",             // nonexistent
	} {
		err := svc.RollbackToVersion(context.Background(), target)
		require.ErrorIs(t, err, ErrRollbackVersionNotAllowed, "target %q should be rejected", target)
	}
}

func TestUpdateServiceRollbackToVersionAcceptsVPrefix(t *testing.T) {
	// No platform asset in the release: the target passes the allowlist check
	// and fails later at asset lookup, proving the version itself was accepted.
	releases := []*GitHubRelease{
		{TagName: "custom-v0.1.147-2"},
		{TagName: "custom-v0.1.146-3"},
	}
	svc := newRollbackTestService("0.1.147-2", releases)

	err := svc.RollbackToVersion(context.Background(), "v0.1.146-3")

	require.Error(t, err)
	require.NotErrorIs(t, err, ErrRollbackVersionNotAllowed)
	require.Contains(t, err.Error(), "no compatible release found")
}
