from __future__ import annotations

import hashlib
from typing import Any

from django.db import OperationalError, ProgrammingError

from apps.catalog.models import DataResource
from apps.catalog import vector_store
from apps.core.storage import gene_data_path, table_data_path


GENE_FILE_EXTENSIONS = {
    ".fa",
    ".fasta",
    ".fq",
    ".fastq",
    ".vcf",
    ".gff",
    ".gff3",
    ".gb",
    ".gbk",
}
TABLE_FILE_EXTENSIONS = {".csv", ".tsv", ".xls", ".xlsx"}


def stable_catalog_code(prefix: str, value: str) -> str:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:12]
    return f"{prefix}-{digest}"


def get_vector_layers_from_geopackage() -> list[dict[str, Any]]:
    return vector_store.list_layers()


def get_vector_layer_info(layer_name: str) -> dict[str, Any] | None:
    return vector_store.get_layer_info(layer_name)


def scan_vector_geopackage() -> list[dict[str, Any]]:
    return get_vector_layers_from_geopackage()


def scan_vector_geopackage_safely() -> None:
    import logging

    logger = logging.getLogger(__name__)
    try:
        scan_vector_geopackage()
    except (OperationalError, ProgrammingError):
        logger.debug("矢量目录扫描跳过：数据库尚未就绪")
    except Exception:
        logger.exception("矢量目录扫描失败")


def scan_nongeographic_files() -> list[DataResource]:
    resources: list[DataResource] = []
    resources.extend(
        _scan_nongeographic_kind(
            DataResource.DataType.GENE, gene_data_path(), GENE_FILE_EXTENSIONS
        )
    )
    resources.extend(
        _scan_nongeographic_kind(
            DataResource.DataType.TABLE, table_data_path(), TABLE_FILE_EXTENSIONS
        )
    )
    return resources


def scan_catalog_sources() -> tuple[list[dict[str, Any]], list[DataResource]]:
    vector_layers = scan_vector_geopackage()
    nongeographic_resources = scan_nongeographic_files()
    return vector_layers, nongeographic_resources


def scan_catalog_sources_safely() -> tuple[list[dict[str, Any]], list[DataResource]]:
    import logging

    logger = logging.getLogger(__name__)
    try:
        return scan_catalog_sources()
    except (OperationalError, ProgrammingError):
        logger.debug("数据目录扫描跳过：数据库尚未就绪")
    except Exception:
        logger.exception("数据目录扫描失败")
    return [], []


def upsert_nongeographic_catalog_record(
    data_type: DataResource.DataType, path
) -> DataResource:
    relative_path = path.relative_to(gene_data_path().parent).as_posix()
    code = stable_catalog_code(data_type.value, relative_path)
    data_type_label = (
        "基因数据" if data_type == DataResource.DataType.GENE else "表格数据"
    )
    resource, _ = DataResource.objects.update_or_create(
        code=code,
        defaults={
            "name": path.stem,
            "data_type": data_type,
            "source": "非地理数据目录扫描",
            "provider": "",
            "spatial_extent": "",
            "coordinate_system": "",
            "file_format": path.suffix.lstrip(".").upper(),
            "storage_path": relative_path,
            "description": f"自动扫描非地理{data_type_label}文件：{relative_path}",
            "quality_note": "",
            "size_bytes": path.stat().st_size,
            "item_count": 0,
            "status": DataResource.Status.ACTIVE,
        },
    )
    return resource


def _scan_nongeographic_kind(
    data_type: DataResource.DataType, root, extensions: set[str]
) -> list[DataResource]:
    if not root.exists():
        return []
    resources: list[DataResource] = []
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        if path.suffix.lower() not in extensions:
            continue
        resources.append(upsert_nongeographic_catalog_record(data_type, path))
    return resources
