#!/usr/bin/env bash
#
# Update a non-Docker Sub2API installation with a custom/template build.
#
# Default mode:
#   - Download the matching binary from the latest GitHub Release
#   - Replace /opt/sub2api/sub2api and restart systemd service
#
# This script intentionally does not back up the database.

set -Eeuo pipefail

SERVICE_NAME="${SERVICE_NAME:-sub2api}"
SERVICE_USER="${SERVICE_USER:-sub2api}"
INSTALL_DIR="${INSTALL_DIR:-/opt/sub2api}"
GITHUB_REPO="${GITHUB_REPO:-xxiyj/sub2api}"
RELEASE_VERSION="${SUB2API_RELEASE:-latest}"
REPO_URL="${SUB2API_REPO_URL:-git@github.com:xxiyj/sub2api.git}"
BRANCH="${SUB2API_BRANCH:-my-template}"
BUILD_ROOT="${SUB2API_BUILD_ROOT:-/opt/sub2api-build}"
HEALTH_URL="${SUB2API_HEALTH_URL:-http://127.0.0.1:8080/health}"
HEALTH_RETRIES="${SUB2API_HEALTH_RETRIES:-20}"
HEALTH_INTERVAL="${SUB2API_HEALTH_INTERVAL:-3}"
GOOS_VALUE="${GOOS_VALUE:-linux}"
GOARCH_VALUE="${GOARCH_VALUE:-amd64}"
KEEP_BACKUPS="${KEEP_BACKUPS:-10}"

SOURCE_DIR="${BUILD_ROOT}/source"
BUILD_OUTPUT="${BUILD_ROOT}/sub2api.new"
BACKUP_DIR="${INSTALL_DIR}/backups/bin"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"
BACKUP_BINARY=""
NEW_BINARY=""
NEW_BINARY_DIR=""
UPDATE_MODE="release"

usage() {
  cat <<EOF
Usage:
  sudo bash deploy/update-custom-binary.sh [options]

Default one-command server update:
  curl -fsSL https://raw.githubusercontent.com/xxiyj/sub2api/my-template/deploy/update-custom-binary.sh | sudo bash

Options:
  --release VERSION  Download from GitHub Releases. Use "latest" or a tag. Default: ${RELEASE_VERSION}
  --github-repo REPO GitHub repository that owns releases. Default: ${GITHUB_REPO}
  --repo URL          Git repository to clone/pull. Default: ${REPO_URL}
  --branch NAME      Git branch to deploy. Default: ${BRANCH}
  --binary PATH      Use an already-built binary instead of building from git.
  --binary-dir DIR   Select sub2api-linux-amd64 or sub2api-linux-arm64 from DIR.
  --build-from-git   Build on the server from --repo and --branch.
  --health-url URL   Health check URL. Default: ${HEALTH_URL}
  --health-retries N Health check retry count. Default: ${HEALTH_RETRIES}
  --health-interval N Seconds between health checks. Default: ${HEALTH_INTERVAL}
  --goarch ARCH      Target architecture. Default: ${GOARCH_VALUE}
  --skip-health      Skip HTTP health check after restart.
  -h, --help         Show this help.

Environment:
  GITHUB_REPO        Same as --github-repo
  GITHUB_TOKEN       Optional token for private release downloads
  SUB2API_RELEASE    Same as --release
  SUB2API_REPO_URL   Same as --repo
  SUB2API_BRANCH     Same as --branch
  SUB2API_BUILD_ROOT Build workspace. Default: /opt/sub2api-build
  SUB2API_HEALTH_URL Same as --health-url
  SUB2API_HEALTH_RETRIES Same as --health-retries
  SUB2API_HEALTH_INTERVAL Same as --health-interval
  GOARCH_VALUE       linux target arch: amd64 or arm64
  KEEP_BACKUPS       Number of old binary backups to keep. Default: 10

Notes:
  - This script does not back up PostgreSQL. Back up the database separately.
  - Default release mode prefers assets named sub2api_<version>_linux_amd64.tar.gz and sub2api_<version>_linux_arm64.tar.gz.
  - It falls back to legacy assets named sub2api-linux-amd64 and sub2api-linux-arm64.
  - --binary-dir mode expects files named sub2api-linux-amd64 and sub2api-linux-arm64.
  - --build-from-git mode requires git, pnpm, node, and go on the server.
  - The installed service is expected at /opt/sub2api/sub2api by default.
EOF
}

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

die() {
  printf '[%s] ERROR: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2
  exit 1
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    die "Please run as root, for example: sudo bash $0"
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

parse_args() {
  SKIP_HEALTH="${SKIP_HEALTH:-false}"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --release)
        [[ $# -ge 2 ]] || die "--release requires a value"
        RELEASE_VERSION="$2"
        UPDATE_MODE="release"
        shift 2
        ;;
      --github-repo)
        [[ $# -ge 2 ]] || die "--github-repo requires a value"
        GITHUB_REPO="$2"
        shift 2
        ;;
      --repo)
        [[ $# -ge 2 ]] || die "--repo requires a value"
        REPO_URL="$2"
        shift 2
        ;;
      --branch)
        [[ $# -ge 2 ]] || die "--branch requires a value"
        BRANCH="$2"
        shift 2
        ;;
      --binary)
        [[ $# -ge 2 ]] || die "--binary requires a value"
        NEW_BINARY="$2"
        UPDATE_MODE="binary"
        shift 2
        ;;
      --binary-dir)
        [[ $# -ge 2 ]] || die "--binary-dir requires a value"
        NEW_BINARY_DIR="$2"
        UPDATE_MODE="binary-dir"
        shift 2
        ;;
      --build-from-git)
        UPDATE_MODE="git-build"
        shift
        ;;
      --health-url)
        [[ $# -ge 2 ]] || die "--health-url requires a value"
        HEALTH_URL="$2"
        shift 2
        ;;
      --health-retries)
        [[ $# -ge 2 ]] || die "--health-retries requires a value"
        HEALTH_RETRIES="$2"
        shift 2
        ;;
      --health-interval)
        [[ $# -ge 2 ]] || die "--health-interval requires a value"
        HEALTH_INTERVAL="$2"
        shift 2
        ;;
      --goarch)
        [[ $# -ge 2 ]] || die "--goarch requires a value"
        GOARCH_VALUE="$2"
        shift 2
        ;;
      --skip-health)
        SKIP_HEALTH="true"
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "Unknown option: $1"
        ;;
    esac
  done
}

check_installation() {
  [[ -f "${INSTALL_DIR}/sub2api" ]] || die "Installed binary not found: ${INSTALL_DIR}/sub2api"
  require_command systemctl
  require_command install
}

detect_arch() {
  local machine
  machine="$(uname -m)"
  case "${machine}" in
    x86_64|amd64)
      printf 'amd64'
      ;;
    aarch64|arm64)
      printf 'arm64'
      ;;
    *)
      die "Unsupported machine architecture from uname -m: ${machine}. Use --binary PATH explicitly."
      ;;
  esac
}

select_binary_from_dir() {
  [[ -n "${NEW_BINARY_DIR}" ]] || return 0
  [[ -d "${NEW_BINARY_DIR}" ]] || die "Binary directory not found: ${NEW_BINARY_DIR}"

  local arch
  arch="$(detect_arch)"
  NEW_BINARY="${NEW_BINARY_DIR}/sub2api-linux-${arch}"
  log "Detected server architecture: ${arch}"
  log "Selected binary: ${NEW_BINARY}"
}

release_asset_url() {
  local asset="$1"
  if [[ "${RELEASE_VERSION}" == "latest" ]]; then
    printf 'https://github.com/%s/releases/latest/download/%s' "${GITHUB_REPO}" "${asset}"
  else
    printf 'https://github.com/%s/releases/download/%s/%s' "${GITHUB_REPO}" "${RELEASE_VERSION}" "${asset}"
  fi
}

curl_download() {
  local url="$1"
  local output="$2"
  local -a args
  args=(-fsSL --retry 3 --connect-timeout 15 --max-time 300)
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    args+=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
  fi
  curl "${args[@]}" "${url}" -o "${output}"
}

curl_stdout() {
  local url="$1"
  local -a args
  args=(-fsSL --retry 3 --connect-timeout 15 --max-time 300)
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    args+=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
  fi
  curl "${args[@]}" "${url}"
}

release_version_label() {
  local tag="${RELEASE_VERSION}"

  if [[ "${tag}" == "latest" ]]; then
    local api_url latest_tag
    api_url="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
    latest_tag="$(curl_stdout "${api_url}" | sed -n 's/^[[:space:]]*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"
    [[ -n "${latest_tag}" ]] || return 1
    tag="${latest_tag}"
  fi

  tag="${tag#custom-v}"
  tag="${tag#v}"
  printf '%s' "${tag}"
}

verify_checksum_if_available() {
  local download_dir="$1"
  local asset="$2"
  local checksums="${download_dir}/checksums.txt"

  require_command curl
  if ! curl_download "$(release_asset_url checksums.txt)" "${checksums}"; then
    log "No checksums.txt release asset found; skipping checksum verification"
    return 0
  fi

  if ! command -v sha256sum >/dev/null 2>&1; then
    log "sha256sum not found; skipping checksum verification"
    return 0
  fi

  if ! grep -E "[[:space:]]${asset}$" "${checksums}" > "${download_dir}/checksums.selected.txt"; then
    log "checksums.txt does not contain ${asset}; skipping checksum verification"
    return 0
  fi

  log "Verifying checksum for ${asset}"
  (
    cd "${download_dir}"
    sha256sum -c checksums.selected.txt
  )
}

download_release_binary() {
  require_command curl

  local arch asset archive legacy_asset download_dir url version
  arch="$(detect_arch)"
  download_dir="/tmp/sub2api-release-${TIMESTAMP}"
  mkdir -p "${download_dir}"

  log "Detected server architecture: ${arch}"

  if version="$(release_version_label)"; then
    archive="sub2api_${version}_linux_${arch}.tar.gz"
    asset="${archive}"
    url="$(release_asset_url "${asset}")"

    log "Downloading ${GITHUB_REPO} release ${RELEASE_VERSION}: ${asset}"
    if curl_download "${url}" "${download_dir}/${archive}"; then
      require_command tar
      verify_checksum_if_available "${download_dir}" "${asset}"
      tar -xzf "${download_dir}/${archive}" -C "${download_dir}"
      if [[ -f "${download_dir}/sub2api" ]]; then
        NEW_BINARY="${download_dir}/sub2api"
      elif [[ -f "${download_dir}/sub2api-linux-${arch}" ]]; then
        NEW_BINARY="${download_dir}/sub2api-linux-${arch}"
      else
        die "Archive ${archive} did not contain sub2api or sub2api-linux-${arch}"
      fi
      chmod +x "${NEW_BINARY}"
      return 0
    fi

    log "Compressed release asset not found; falling back to legacy binary asset"
  else
    log "Could not resolve latest release version; falling back to legacy binary asset"
  fi

  legacy_asset="sub2api-linux-${arch}"
  url="$(release_asset_url "${legacy_asset}")"
  NEW_BINARY="${download_dir}/${legacy_asset}"

  log "Downloading ${GITHUB_REPO} release ${RELEASE_VERSION}: ${legacy_asset}"
  curl_download "${url}" "${NEW_BINARY}"
  chmod +x "${NEW_BINARY}"
  verify_checksum_if_available "${download_dir}" "${legacy_asset}"
}

prepare_git_source() {
  require_command git
  require_command pnpm
  require_command go

  mkdir -p "${BUILD_ROOT}"

  if [[ ! -d "${SOURCE_DIR}/.git" ]]; then
    log "Cloning ${REPO_URL} (${BRANCH}) into ${SOURCE_DIR}"
    rm -rf "${SOURCE_DIR}"
    git clone --branch "${BRANCH}" --single-branch "${REPO_URL}" "${SOURCE_DIR}"
  else
    log "Updating existing source checkout"
    git -C "${SOURCE_DIR}" remote set-url origin "${REPO_URL}"
    git -C "${SOURCE_DIR}" fetch origin "${BRANCH}"
    git -C "${SOURCE_DIR}" checkout "${BRANCH}"
    git -C "${SOURCE_DIR}" reset --hard "origin/${BRANCH}"
  fi
}

build_from_source() {
  log "Building frontend"
  pnpm --dir "${SOURCE_DIR}/frontend" install --frozen-lockfile
  pnpm --dir "${SOURCE_DIR}/frontend" run build

  log "Building backend with embedded frontend for ${GOOS_VALUE}/${GOARCH_VALUE}"
  mkdir -p "$(dirname "${BUILD_OUTPUT}")"
  (
    cd "${SOURCE_DIR}/backend"
    CGO_ENABLED=0 GOOS="${GOOS_VALUE}" GOARCH="${GOARCH_VALUE}" go build \
      -tags embed \
      -ldflags="-s -w" \
      -trimpath \
      -o "${BUILD_OUTPUT}" \
      ./cmd/server
  )

  NEW_BINARY="${BUILD_OUTPUT}"
}

validate_new_binary() {
  [[ -f "${NEW_BINARY}" ]] || die "New binary not found: ${NEW_BINARY}"
  chmod +x "${NEW_BINARY}"
  if ! "${NEW_BINARY}" --version >/dev/null 2>&1; then
    log "Warning: '${NEW_BINARY} --version' did not exit cleanly; continuing because some custom builds may not print version normally."
  fi
}

backup_current_binary() {
  mkdir -p "${BACKUP_DIR}"
  BACKUP_BINARY="${BACKUP_DIR}/sub2api.${TIMESTAMP}"
  log "Backing up current binary to ${BACKUP_BINARY}"
  cp "${INSTALL_DIR}/sub2api" "${BACKUP_BINARY}"
  chmod 755 "${BACKUP_BINARY}"
}

stop_service() {
  if systemctl is-active --quiet "${SERVICE_NAME}"; then
    log "Stopping ${SERVICE_NAME}"
    systemctl stop "${SERVICE_NAME}"
  else
    log "${SERVICE_NAME} is not active; continuing"
  fi
}

install_new_binary() {
  log "Installing new binary to ${INSTALL_DIR}/sub2api"
  install -m 755 -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${NEW_BINARY}" "${INSTALL_DIR}/sub2api"
}

start_service() {
  log "Starting ${SERVICE_NAME}"
  systemctl start "${SERVICE_NAME}"
}

check_service() {
  log "Checking systemd service"
  systemctl is-active --quiet "${SERVICE_NAME}" || return 1

  if [[ "${SKIP_HEALTH}" == "true" ]]; then
    log "Health check skipped"
    return 0
  fi

  require_command curl
  [[ "${HEALTH_RETRIES}" =~ ^[0-9]+$ && "${HEALTH_RETRIES}" -gt 0 ]] || die "--health-retries must be a positive integer"
  [[ "${HEALTH_INTERVAL}" =~ ^[0-9]+$ && "${HEALTH_INTERVAL}" -gt 0 ]] || die "--health-interval must be a positive integer"

  log "Checking health endpoint: ${HEALTH_URL} (${HEALTH_RETRIES} attempts, ${HEALTH_INTERVAL}s interval)"
  local attempt
  for ((attempt=1; attempt<=HEALTH_RETRIES; attempt++)); do
    if curl -fsS --max-time 10 "${HEALTH_URL}" >/dev/null; then
      log "Health check passed on attempt ${attempt}"
      return 0
    fi

    if [[ "${attempt}" -lt "${HEALTH_RETRIES}" ]]; then
      log "Health check attempt ${attempt}/${HEALTH_RETRIES} failed; retrying in ${HEALTH_INTERVAL}s"
      sleep "${HEALTH_INTERVAL}"
    fi
  done

  return 1
}

rollback_binary() {
  if [[ -n "${BACKUP_BINARY}" && -f "${BACKUP_BINARY}" ]]; then
    log "Rolling back binary from ${BACKUP_BINARY}"
    install -m 755 -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${BACKUP_BINARY}" "${INSTALL_DIR}/sub2api"
    systemctl start "${SERVICE_NAME}" || true
  fi
}

cleanup_old_backups() {
  [[ "${KEEP_BACKUPS}" =~ ^[0-9]+$ ]] || return 0
  [[ "${KEEP_BACKUPS}" -gt 0 ]] || return 0
  [[ -d "${BACKUP_DIR}" ]] || return 0

  mapfile -t backups < <(find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'sub2api.*' | sort -r)
  local count="${#backups[@]}"
  if [[ "${count}" -le "${KEEP_BACKUPS}" ]]; then
    return 0
  fi

  log "Pruning old binary backups, keeping ${KEEP_BACKUPS}"
  local i
  for ((i=KEEP_BACKUPS; i<count; i++)); do
    rm -f "${backups[$i]}"
  done
}

main() {
  parse_args "$@"
  require_root
  check_installation

  case "${UPDATE_MODE}" in
    release)
      download_release_binary
      ;;
    binary)
      ;;
    binary-dir)
      select_binary_from_dir
      ;;
    git-build)
      prepare_git_source
      build_from_source
      ;;
    *)
      die "Unknown update mode: ${UPDATE_MODE}"
      ;;
  esac

  validate_new_binary
  backup_current_binary
  stop_service

  if ! install_new_binary; then
    rollback_binary
    die "Failed to install new binary"
  fi

  if ! start_service; then
    rollback_binary
    die "Failed to start ${SERVICE_NAME}; rolled back binary"
  fi

  if ! check_service; then
    log "New deployment failed verification"
    systemctl stop "${SERVICE_NAME}" || true
    rollback_binary
    die "Deployment failed; rolled back binary. Check logs with: sudo journalctl -u ${SERVICE_NAME} -n 200 --no-pager"
  fi

  cleanup_old_backups
  log "Update complete"
  log "Current binary backup: ${BACKUP_BINARY}"
}

main "$@"
