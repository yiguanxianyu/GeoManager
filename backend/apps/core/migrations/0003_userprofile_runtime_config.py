from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def initialize_runtime_config(apps, schema_editor):
    from apps.core.config import ensure_runtime_config_file

    ensure_runtime_config_file(settings.PROJECT_CONFIG)


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0002_systemsetting"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("avatar_url", models.URLField(blank=True, verbose_name="头像 URL")),
                (
                    "department",
                    models.CharField(blank=True, max_length=120, verbose_name="部门"),
                ),
                (
                    "disabled_permissions",
                    models.JSONField(
                        blank=True,
                        default=list,
                        verbose_name="用户主动关闭的权限",
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="更新时间"),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="profile",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="用户",
                    ),
                ),
            ],
            options={
                "verbose_name": "用户资料",
                "verbose_name_plural": "用户资料",
            },
        ),
        migrations.RunPython(initialize_runtime_config, migrations.RunPython.noop),
    ]
