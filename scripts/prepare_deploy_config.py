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

    runtime.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, runtime)

    http_port = runtime_table.get("http_port", 80)
    print(f"RUNTIME_CONFIG={runtime}")
    print(f"APP_HTTP_PORT={http_port}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
