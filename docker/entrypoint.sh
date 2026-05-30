#!/usr/bin/env bash
set -euo pipefail

APP_ROOT=/opt/app
BACKEND_ROOT="${APP_ROOT}/backend"
APP_DATA_ROOT="${APP_DATA_ROOT:-/data/app}"
GEOGRAPHIC_ROOT="${APP_GEOGRAPHIC_ROOT:-/data/geographic}"
GUNICORN_BIND="${GUNICORN_BIND:-0.0.0.0:8000}"
GUNICORN_WORKERS="${GUNICORN_WORKERS:-1}"
LOG_ROOT="${APP_DATA_ROOT}/logs"

export PATH="/opt/conda/bin:${PATH}"
export PYTHONPATH="${BACKEND_ROOT}:${PYTHONPATH:-}"
export APP_CONFIG="${APP_CONFIG:-/config/app.toml}"
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-data_sharing_platform.settings}"

app_data_is_empty() {
  [[ ! -d "${APP_DATA_ROOT}" ]] && return 0
  [[ -z "$(find "${APP_DATA_ROOT}" -mindepth 1 -maxdepth 1 -print -quit)" ]]
}

wait_for_config() {
  if [[ ! -f "${APP_CONFIG}" ]]; then
    echo "TOML 配置文件不存在：${APP_CONFIG}" >&2
    echo "请通过 -v /host/app.toml:/config/app.toml:ro 或 APP_CONFIG 指定容器内配置路径。" >&2
    exit 1
  fi
}

case "${1:-serve}" in
  serve)
    if app_data_is_empty; then
      echo "业务数据目录为空，按首次启动流程执行数据库迁移。"
    fi
    wait_for_config
    cd "${BACKEND_ROOT}"
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput
    exec gunicorn data_sharing_platform.wsgi:application \
      --bind "${GUNICORN_BIND}" \
      --workers "${GUNICORN_WORKERS}" \
      --access-logfile "${LOG_ROOT}/gunicorn-access.log" \
      --error-logfile "${LOG_ROOT}/gunicorn-error.log"
    ;;
  manage)
    shift
    wait_for_config
    cd "${BACKEND_ROOT}"
    exec python manage.py "$@"
    ;;
  shell)
    exec /bin/bash
    ;;
  *)
    exec "$@"
    ;;
esac
