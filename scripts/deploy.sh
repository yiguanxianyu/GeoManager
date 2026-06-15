#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SOURCE_CONFIG_FILE="${1:-}"
RUNTIME_DIR="${PROJECT_ROOT}/.deploy"
IMAGE_NAME="${2:-data-platform-django:latest}"
CONTAINER_NAME="${3:-data-platform}"
DATA_VOLUME="${DATA_VOLUME:-geomanager-data}"

cd "${PROJECT_ROOT}"

git pull --ff-only
docker build -t "${IMAGE_NAME}" .

if [[ -z "${SOURCE_CONFIG_FILE}" ]]; then
  cat >&2 <<EOF
缺少配置文件参数。
用法：scripts/deploy.sh /path/to/app.toml [image-name] [container-name]
EOF
  exit 1
fi

if [[ ! -f "${SOURCE_CONFIG_FILE}" ]]; then
  echo "配置文件不存在：${SOURCE_CONFIG_FILE}" >&2
  exit 1
fi

mkdir -p "${RUNTIME_DIR}"

CONFIG_VALUES="$(
  eval "$(mamba shell hook --shell bash)"
  mamba activate geomanager
  python "${PROJECT_ROOT}/scripts/prepare_deploy_config.py" "${SOURCE_CONFIG_FILE}" "${RUNTIME_DIR}/app.toml"
)"

while IFS='=' read -r key value; do
  case "${key}" in
    APP_HTTP_PORT|RUNTIME_CONFIG)
      export "${key}=${value}"
      ;;
  esac
done <<< "${CONFIG_VALUES}"

docker volume create "${DATA_VOLUME}" >/dev/null
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true

docker run -d --name "${CONTAINER_NAME}" \
  -p "${APP_HTTP_PORT}:8000" \
  -v "${RUNTIME_CONFIG}:/config/app.toml:ro" \
  -v "${DATA_VOLUME}:/data" \
  "${IMAGE_NAME}" serve /config/app.toml
docker ps --filter "name=${CONTAINER_NAME}"
