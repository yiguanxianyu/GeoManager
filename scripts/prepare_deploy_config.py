from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: prepare_deploy_config.py SOURCE_CONFIG RUNTIME_CONFIG", file=sys.stderr)
        return 2

    source = Path(sys.argv[1]).expanduser().resolve()
    runtime = Path(sys.argv[2]).expanduser().resolve()

    raw = source.read_text()

    # 确保 runtime 目录存在
    runtime.parent.mkdir(parents=True, exist_ok=True)

    # 直接复制配置文件到 runtime 位置
    runtime.write_text(raw)

    print(f"APP_CONFIG={runtime}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
