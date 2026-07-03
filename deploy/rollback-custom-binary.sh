#!/usr/bin/env bash
#
# Roll back a non-Docker Sub2API installation to a previously backed-up binary.
#
# This script intentionally does not restore PostgreSQL. If a failed update ran
# database migrations, restore the database backup separately.

set -Eeuo pipefail

SERVICE_NAME="${SERVICE_NAME:-sub2api}"
SERVICE_USER="${SERVICE_USER:-sub2api}"
INSTALL_DIR="${INSTALL_DIR:-/opt/sub2api}"
BACKUP_DIR="${BACKUP_DIR:-${INSTALL_DIR}/backups/bin}"
HEALTH_URL="${SUB2API_HEALTH_URL:-http://127.0.0.1:8080/health}"
ROLLBACK_BINARY=""
SKIP_HEALTH="${SKIP_HEALTH:-false}"

usage() {
  cat <<EOF
Usage:
  sudo bash deploy/rollback-custom-binary.sh [options]

Default one-command rollback:
  curl -fsSL https://raw.githubusercontent.com/xxiyj/sub2api/my-template/deploy/rollback-custom-binary.sh | sudo bash

Options:
  --backup PATH      Roll back to a specific backup binary.
  --list            List available backup binaries.
  --health-url URL  Health check URL. Default: ${HEALTH_URL}
  --skip-health     Skip HTTP health check after restart.
  -h, --help        Show this help.

Notes:
  - Default mode rolls back to the newest file matching ${BACKUP_DIR}/sub2api.*
  - This script does not restore PostgreSQL. Restore database backups separately if needed.
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

list_backups() {
  if [[ ! -d "${BACKUP_DIR}" ]]; then
    die "Backup directory not found: ${BACKUP_DIR}"
  fi
  find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'sub2api.*' -printf '%T@ %p\n' |
    sort -rn |
    awk '{ $1=""; sub(/^ /, ""); print }'
}

latest_backup() {
  list_backups | head -n 1
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --backup)
        [[ $# -ge 2 ]] || die "--backup requires a value"
        ROLLBACK_BINARY="$2"
        shift 2
        ;;
      --list)
        list_backups
        exit 0
        ;;
      --health-url)
        [[ $# -ge 2 ]] || die "--health-url requires a value"
        HEALTH_URL="$2"
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

select_backup() {
  if [[ -z "${ROLLBACK_BINARY}" ]]; then
    ROLLBACK_BINARY="$(latest_backup)"
  fi
  [[ -n "${ROLLBACK_BINARY}" ]] || die "No backup binary found in ${BACKUP_DIR}"
  [[ -f "${ROLLBACK_BINARY}" ]] || die "Backup binary not found: ${ROLLBACK_BINARY}"
}

stop_service() {
  if systemctl is-active --quiet "${SERVICE_NAME}"; then
    log "Stopping ${SERVICE_NAME}"
    systemctl stop "${SERVICE_NAME}"
  fi
}

install_backup() {
  log "Restoring backup binary: ${ROLLBACK_BINARY}"
  install -m 755 -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${ROLLBACK_BINARY}" "${INSTALL_DIR}/sub2api"
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
  log "Checking health endpoint: ${HEALTH_URL}"
  curl -fsS --max-time 10 "${HEALTH_URL}" >/dev/null
}

main() {
  parse_args "$@"
  require_root
  require_command systemctl
  require_command install
  [[ -d "${INSTALL_DIR}" ]] || die "Install directory not found: ${INSTALL_DIR}"

  select_backup
  stop_service
  install_backup
  start_service

  if ! check_service; then
    die "Rollback binary was restored, but service verification failed. Check logs with: sudo journalctl -u ${SERVICE_NAME} -n 200 --no-pager"
  fi

  log "Rollback complete"
}

main "$@"
