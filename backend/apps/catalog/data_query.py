from __future__ import annotations

from typing import Any

from apps.catalog import vector_store
from apps.catalog.models import DataResource
from apps.catalog.vector_store import (
    DataQueryError,
    ResourceProfile,
    _coerce_value,
    _json_value,
    _limit,
    apply_attribute_filters,
    apply_spatial_filter,
    field_metadata_for_layer,
    field_profiles,
    geometry_type,
    normalize_for_geojson,
    read_field_metadata,
    spatial_filter_geometry,
)

__all__ = [
    "DataQueryError",
    "ResourceProfile",
    "get_resource_profile",
    "get_vector_resource_profile",
    "query_resource",
    "query_vector_resource",
    "read_vector_resource",
    "read_vector_layer",
    "read_field_metadata",
    "field_metadata_for_layer",
    "field_profiles",
    "geometry_type",
    "spatial_filter_geometry",
    "apply_spatial_filter",
    "apply_attribute_filters",
    "normalize_for_geojson",
    "_limit",
    "_coerce_value",
    "_json_value",
]


def get_resource_profile(resource: DataResource) -> ResourceProfile:
    if resource.data_type == DataResource.DataType.RASTER:
        from apps.raster.services.profile import get_raster_profile

        raster_info = get_raster_profile(resource)
        if not raster_info:
            return ResourceProfile(
                fields=[], feature_count=None, geometry_type="Raster", bounds=[]
            )
        return ResourceProfile(
            fields=raster_info["fields"],
            feature_count=None,
            geometry_type="Raster",
            bounds=raster_info["bounds"],
            raster=raster_info["raster"],
        )
    return vector_store.resource_profile(resource)


def get_vector_resource_profile(
    resource: DataResource | None = None, layer_name: str | None = None
) -> ResourceProfile:
    if resource is not None:
        return get_resource_profile(resource)

    if layer_name is None:
        return ResourceProfile(
            fields=[], feature_count=None, geometry_type="", bounds=[]
        )

    return vector_store.layer_profile(layer_name)


def query_resource(resource: DataResource, payload: dict[str, Any]) -> dict[str, Any]:
    return vector_store.query_resource(resource, payload)


def query_vector_resource(
    resource: DataResource | None = None,
    payload: dict[str, Any] | None = None,
    layer_name: str | None = None,
) -> dict[str, Any]:
    if payload is None:
        payload = {}

    if resource is not None:
        return vector_store.query_resource(resource, payload)

    if layer_name is None:
        raise DataQueryError("必须指定资源或图层名称")

    return vector_store.query_layer(layer_name, payload)


read_vector_resource = vector_store.read_resource
read_vector_layer = vector_store.read_layer
