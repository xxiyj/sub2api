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
	release  *GitHubRelease
	releases []GitHubRelease
}

func (s *updateServiceGitHubClientStub) FetchLatestRelease(context.Context, string) (*GitHubRelease, error) {
	return s.release, nil
}

func (s *updateServiceGitHubClientStub) FetchReleases(context.Context, string, int) ([]GitHubRelease, error) {
	if s.releases != nil {
		return s.releases, nil
	}
	return []GitHubRelease{*s.release}, nil
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
			releases: []GitHubRelease{
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

func TestMatchingUpdateAssetSupportsCustomBinaryNames(t *testing.T) {
	require.True(t, isMatchingUpdateAsset("sub2api-linux-amd64", []string{"sub2api-linux-amd64", "linux_amd64"}))
	require.True(t, isMatchingUpdateAsset("sub2api_linux_amd64.tar.gz", []string{"sub2api-linux-amd64", "linux_amd64"}))
	require.False(t, isMatchingUpdateAsset("checksums.txt", []string{"sub2api-linux-amd64", "linux_amd64"}))
}
