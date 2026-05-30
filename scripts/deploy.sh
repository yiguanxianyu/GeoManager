#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "${PROJECT_ROOT}/.env" ]]; then
  set -a
  source "${PROJECT_ROOT}/.env"
  set +a
fi

COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_ROOT}/docker-compose.yml}"
SOURCE_CONFIG_FILE="${APP_SOURCE_CONFIG_FILE:-${1:-}}"
RUNTIME_DIR="${APP_RUNTIME_DIR:-${PROJECT_ROOT}/.deploy}"
APP_HTTP_PORT="${APP_HTTP_PORT:-80}"

if [[ -z "${SOURCE_CONFIG_FILE}" ]]; then
  cat >&2 <<EOF
缺少配置文件参数。
用法：APP_SOURCE_CONFIG_FILE=/path/to/app.toml scripts/deploy.sh
或：scripts/deploy.sh /path/to/app.toml
EOF
  exit 1
fi

if [[ ! -f "${SOURCE_CONFIG_FILE}" ]]; then
  echo "配置文件不存在：${SOURCE_CONFIG_FILE}" >&2
  exit 1
fi

mkdir -p "${RUNTIME_DIR}"

CONFIG_VALUES="$(
  python3 "${PROJECT_ROOT}/scripts/prepare_deploy_config.py" "${SOURCE_CONFIG_FILE}" "${RUNTIME_DIR}/app.toml"
)"

while IFS='=' read -r key value; do
  case "${key}" in
    APP_CONFIG_FILE | APP_BUSINESS_DATA_ROOT | APP_GEOGRAPHIC_DATA_ROOT)
      export "${key}=${value}"
      ;;
  esac
done <<< "${CONFIG_VALUES}"
export APP_HTTP_PORT

cd "${PROJECT_ROOT}"

git pull --ff-only
docker compose -f "${COMPOSE_FILE}" build
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans
docker compose -f "${COMPOSE_FILE}" ps
