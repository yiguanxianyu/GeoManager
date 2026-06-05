#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_ROOT}/docker-compose.yml}"
SOURCE_CONFIG_FILE="${1:-}"
RUNTIME_DIR="${PROJECT_ROOT}/.deploy"
APP_DOCKER_BUILD_MODE="${2:-serial}"

if [[ -z "${SOURCE_CONFIG_FILE}" ]]; then
  cat >&2 <<EOF
缺少配置文件参数。
用法：scripts/deploy.sh /path/to/app.toml [serial|parallel]
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
    APP_HTTP_PORT|RUNTIME_CONFIG)
      export "${key}=${value}"
      ;;
  esac
done <<< "${CONFIG_VALUES}"

cd "${PROJECT_ROOT}"

git pull --ff-only
case "${APP_DOCKER_BUILD_MODE}" in
  parallel)
    docker compose -f "${COMPOSE_FILE}" build
    ;;
  serial)
    docker compose -f "${COMPOSE_FILE}" build django
    docker compose -f "${COMPOSE_FILE}" build nginx
    ;;
  *)
    echo "APP_DOCKER_BUILD_MODE 只能是 parallel 或 serial，当前值：${APP_DOCKER_BUILD_MODE}" >&2
    exit 1
    ;;
esac
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans
docker compose -f "${COMPOSE_FILE}" ps
