from __future__ import annotations

from dataclasses import dataclass

from django.contrib.auth.models import Permission
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse


@dataclass(frozen=True)
class FeaturePermissionDef:
    app_label: str
    codename: str
    name: str
    group: str

    @property
    def perm_name(self) -> str:
        return f"{self.app_label}.{self.codename}"


FEATURE_PERMISSIONS: tuple[FeaturePermissionDef, ...] = (
    FeaturePermissionDef("core", "access_admin", "进入后台管理", "系统管理"),
    FeaturePermissionDef(
        "core", "manage_feature_permissions", "配置功能权限", "系统管理"
    ),
    FeaturePermissionDef("core", "create_user", "新建用户", "系统管理"),
    FeaturePermissionDef("core", "browse_data", "浏览数据", "数据功能"),
    FeaturePermissionDef("core", "query_data", "查询数据", "数据功能"),
    FeaturePermissionDef("core", "load_vector_layer", "加载矢量图层", "图层功能"),
    FeaturePermissionDef("core", "load_raster_layer", "加载栅格图层", "图层功能"),
    FeaturePermissionDef("core", "custom_symbolization", "自定义符号化", "图层功能"),
    FeaturePermissionDef("catalog", "export_dataresource", "导出数据资源", "数据管理"),
    FeaturePermissionDef(
        "catalog", "maintain_dataresource", "维护数据资源", "数据管理"
    ),
    FeaturePermissionDef(
        "raster", "manage_raster_dataset", "管理栅格数据集", "栅格管理"
    ),
)

FEATURE_PERMISSION_NAMES = tuple(item.perm_name for item in FEATURE_PERMISSIONS)


def has_feature_perm(user, perm_name: str) -> bool:
    if not user.is_authenticated:
        return False
    if user.is_superuser:
        return perm_name not in disabled_feature_permissions(user)
    return user.has_perm(perm_name) and perm_name not in disabled_feature_permissions(
        user
    )


def granted_feature_permissions(user) -> set[str]:
    if not user.is_authenticated:
        return set()
    if user.is_superuser:
        return set(FEATURE_PERMISSION_NAMES)
    return {
        permission
        for permission in FEATURE_PERMISSION_NAMES
        if user.has_perm(permission)
    }


def disabled_feature_permissions(user) -> set[str]:
    if not user.is_authenticated:
        return set()
    profile = _user_profile(user)
    if profile is None:
        return set()
    disabled = {
        permission
        for permission in profile.disabled_permissions
        if permission in FEATURE_PERMISSION_NAMES
    }
    from apps.core.initialization import (
        is_superadmin_user,
        superadmin_group_locked_permissions,
    )

    if is_superadmin_user(user):
        disabled -= superadmin_group_locked_permissions()
    return disabled


def effective_feature_permissions(user) -> set[str]:
    if user.is_superuser:
        return set(FEATURE_PERMISSION_NAMES)
    return granted_feature_permissions(user) - disabled_feature_permissions(user)


def _user_profile(user):
    try:
        return user.profile
    except ObjectDoesNotExist:
        return None


def group_names(user) -> str:
    names = (
        list(user.groups.values_list("name", flat=True))
        if user.is_authenticated
        else []
    )
    return "、".join(names) if names else "未分组"


def permission_denied_message(user) -> str:
    return f"当前用户组“{group_names(user)}”无权限"


def feature_denied_response(user) -> JsonResponse:
    return JsonResponse({"detail": permission_denied_message(user)}, status=403)


def feature_permission_queryset():
    app_labels = {item.app_label for item in FEATURE_PERMISSIONS}
    codenames = {item.codename for item in FEATURE_PERMISSIONS}
    return Permission.objects.select_related("content_type").filter(
        content_type__app_label__in=app_labels,
        codename__in=codenames,
    )


def feature_permission_ids_for(group) -> set[int]:
    feature_ids = feature_permission_queryset().values_list("id", flat=True)
    return set(
        group.permissions.filter(id__in=feature_ids).values_list("id", flat=True)
    )
