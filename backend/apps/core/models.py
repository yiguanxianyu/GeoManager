from django.db import models


class FeaturePermission(models.Model):
    class Meta:
        verbose_name = "平台功能权限"
        verbose_name_plural = "平台功能权限"
        default_permissions = ()
        permissions = [
            ("access_admin", "可进入后台管理"),
            ("manage_feature_permissions", "可配置功能权限"),
            ("browse_data", "可浏览数据"),
            ("query_data", "可查询数据"),
            ("load_vector_layer", "可加载矢量图层"),
            ("load_raster_layer", "可加载栅格图层"),
            ("custom_symbolization", "可自定义符号化"),
        ]

