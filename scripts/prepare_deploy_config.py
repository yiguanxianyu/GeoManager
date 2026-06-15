from __future__ import annotations

import shutil
import sys
from pathlib import Path

import tomlkit
from tomlkit.exceptions import TOMLKitError


def main() -> int:
    if len(sys.argv) != 3:
        print(
            "usage: prepare_deploy_config.py SOURCE_CONFIG RUNTIME_CONFIG",
            file=sys.stderr,
        )
        return 2

    source = Path(sys.argv[1]).expanduser().resolve()
    runtime = Path(sys.argv[2]).expanduser().resolve()
    try:
        raw = tomlkit.parse(source.read_text(encoding="utf-8"))
    except TOMLKitError as exc:
        print(f"TOML 配置格式错误：{exc}", file=sys.stderr)
        return 2
    runtime_table = raw.get("runtime")
    if not hasattr(runtime_table, "get"):
        print("TOML 配置缺少 [runtime] 段", file=sys.stderr)
        return 2

    application_table = raw.get("application")
    if not hasattr(application_table, "get"):
        print("TOML 配置缺少 [application] 段", file=sys.stderr)
        return 2
    storage_table = application_table.get("storage")
    if not hasattr(storage_table, "get"):
        print("TOML 配置缺少 [application.storage] 段", file=sys.stderr)
        return 2

    app_data_raw = storage_table.get("app_data")
    research_data_raw = storage_table.get("research_data_root")
    if not isinstance(app_data_raw, str) or not app_data_raw.strip():
        print("TOML 配置缺少 application.storage.app_data", file=sys.stderr)
        return 2
    if not isinstance(research_data_raw, str) or not research_data_raw.strip():
        print("TOML 配置缺少 application.storage.research_data_root", file=sys.stderr)
        return 2

    app_data_path = Path(app_data_raw).expanduser()
    research_data_path = Path(research_data_raw).expanduser()
    if not app_data_path.is_absolute():
        print("application.storage.app_data 必须是绝对路径", file=sys.stderr)
        return 2
    if not research_data_path.is_absolute():
        print(
            "application.storage.research_data_root 必须是绝对路径",
            file=sys.stderr,
        )
        return 2
    runtime.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, runtime)
    runtime_raw = tomlkit.parse(runtime.read_text(encoding="utf-8"))
    runtime_storage = runtime_raw["application"]["storage"]
    runtime_storage["app_data"] = "/data/app"
    runtime_storage["research_data_root"] = "/data/research"
    runtime.write_text(tomlkit.dumps(runtime_raw), encoding="utf-8")

    http_port = runtime_table.get("http_port", 80)
    print(f"RUNTIME_CONFIG={runtime}")
    print(f"APP_HTTP_PORT={http_port}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
