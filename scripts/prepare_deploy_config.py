from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Optional


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: prepare_deploy_config.py SOURCE_CONFIG RUNTIME_CONFIG", file=sys.stderr)
        return 2

    source = Path(sys.argv[1]).expanduser().resolve()
    runtime = Path(sys.argv[2]).expanduser().resolve()

    raw = source.read_text()
    storage_match = re.search(r"(?ms)^\s*\[storage\]\s*$([\s\S]*?)(?=^\s*\[|\Z)", raw)
    if storage_match is None:
        print("配置文件缺少 [storage] 段", file=sys.stderr)
        return 2

    storage_raw = storage_match.group(1)
    business_root = _read_storage_string(storage_raw, "business_data_root")
    geographic_root = _read_storage_string(storage_raw, "geographic_data_root")
    if not business_root:
        print("配置项 storage.business_data_root 必须是非空字符串", file=sys.stderr)
        return 2
    if not geographic_root:
        print("配置项 storage.geographic_data_root 必须是非空字符串", file=sys.stderr)
        return 2

    business_path = Path(business_root).expanduser().resolve()
    geographic_path = Path(geographic_root).expanduser().resolve()
    business_path.mkdir(parents=True, exist_ok=True)
    geographic_path.mkdir(parents=True, exist_ok=True)
    runtime.parent.mkdir(parents=True, exist_ok=True)

    rewritten = re.sub(
        r'(^\s*business_data_root\s*=\s*)["\'][^"\']*["\']',
        r'\1"/data/business"',
        raw,
        count=1,
        flags=re.MULTILINE,
    )
    rewritten = re.sub(
        r'(^\s*geographic_data_root\s*=\s*)["\'][^"\']*["\']',
        r'\1"/data/geographic"',
        rewritten,
        count=1,
        flags=re.MULTILINE,
    )
    runtime.write_text(rewritten)

    print(f"APP_CONFIG_FILE={runtime}")
    print(f"APP_BUSINESS_DATA_ROOT={business_path}")
    print(f"APP_GEOGRAPHIC_DATA_ROOT={geographic_path}")
    return 0


def _read_storage_string(storage_raw: str, key: str) -> Optional[str]:
    match = re.search(rf'(?m)^\s*{re.escape(key)}\s*=\s*["\']([^"\']+)["\']\s*(?:#.*)?$', storage_raw)
    if match is None:
        return None
    return match.group(1).strip()


if __name__ == "__main__":
    raise SystemExit(main())
