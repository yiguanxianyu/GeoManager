# Generated manually for new feature permissions.

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0005_userprofile_avatar_data_userprofile_avatar_content_type"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="featurepermission",
            options={
                "default_permissions": (),
                "permissions": [
                    ("access_admin", "可进入后台管理"),
                    ("manage_feature_permissions", "可配置功能权限"),
                    ("create_user", "可新建用户"),
                    ("view_operation_logs", "可查看操作日志"),
                    ("manage_system_settings", "可修改系统设置"),
                    ("manage_auth", "可修改认证授权"),
                    ("browse_data", "可浏览数据"),
                    ("query_data", "可查询数据"),
                    ("load_vector_layer", "可加载矢量图层"),
                    ("load_raster_layer", "可加载栅格图层"),
                    ("custom_symbolization", "可自定义符号化"),
                ],
                "verbose_name": "平台功能权限",
                "verbose_name_plural": "平台功能权限",
            },
        ),
    ]
