import json
import tempfile
from pathlib import Path

import tomlkit
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.test import SimpleTestCase, TestCase
from data_sharing_platform.settings import _default_csrf_trusted_origins

from apps.audit.models import OperationLog
from apps.core.admin import FeatureGroupForm
from apps.core.config import (
    ensure_runtime_config_file,
    load_project_config,
    update_runtime_application_config,
)
from apps.core.models import SystemSetting
from apps.core.storage import (
    StoragePathError,
    gene_data_path,
    raster_metadata_path,
    raster_processed_path,
    raster_source_path,
    research_path,
    table_data_path,
)


class BootstrapApiTests(TestCase):
    def test_bootstrap_returns_public_runtime_settings(self):
        SystemSetting.objects.update_or_create(
            pk=1, defaults={"allow_registration": False}
        )

        response = self.client.get("/api/bootstrap/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("systemName", payload)
        self.assertFalse(payload["allowRegistration"])
        self.assertIn("map", payload)


class CsrfSettingsTests(SimpleTestCase):
    def test_debug_defaults_trust_vite_dev_origins_with_wildcard_allowed_hosts(self):
        origins = _default_csrf_trusted_origins(["*"], debug=True)

        self.assertIn("http://127.0.0.1:5173", origins)
        self.assertIn("http://localhost:5173", origins)
        self.assertNotIn("http://*", origins)


class RegistrationApiTests(TestCase):
    def test_first_registered_user_becomes_system_admin(self):
        SystemSetting.objects.update_or_create(
            pk=1, defaults={"allow_registration": True}
        )

        response = self.client.post(
            "/api/auth/register/",
            data=json.dumps(
                {
                    "username": "admin",
                    "email": "admin@example.local",
                    "password": "StrongPass12345",
                    "passwordConfirm": "StrongPass12345",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        user = get_user_model().objects.get(username="admin")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_registration_can_be_closed_by_system_setting(self):
        SystemSetting.objects.update_or_create(
            pk=1, defaults={"allow_registration": False}
        )

        response = self.client.post(
            "/api/auth/register/",
            data=json.dumps(
                {
                    "username": "closed",
                    "password": "StrongPass12345",
                    "passwordConfirm": "StrongPass12345",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)


class FeaturePermissionTests(TestCase):
    def test_admin_requires_access_admin_permission_not_staff_flag(self):
        user = get_user_model().objects.create_user(
            username="staff-no-access", password="pass12345", is_staff=True
        )
        group = Group.objects.create(name="普通用户")
        user.groups.add(group)
        self.client.force_login(user)

        response = self.client.get("/admin2/")

        self.assertEqual(response.status_code, 403)
        self.assertIn("当前用户组“普通用户”无权限", response.content.decode("utf-8"))

    def test_access_admin_permission_allows_non_staff_admin_entry(self):
        user = get_user_model().objects.create_user(
            username="admin-access", password="pass12345", is_staff=False
        )
        grant(user, ("core", "access_admin"))
        self.client.force_login(user)

        response = self.client.get("/admin2/")

        self.assertEqual(response.status_code, 200)

    def test_old_admin_path_redirects_to_admin2(self):
        response = self.client.get("/admin/")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/admin2/")

    def test_feature_group_form_preserves_non_feature_permissions(self):
        group = Group.objects.create(name="科研用户")
        add_user = Permission.objects.get(
            content_type__app_label="auth", codename="add_user"
        )
        browse_data = Permission.objects.get(
            content_type__app_label="core", codename="browse_data"
        )
        group.permissions.add(add_user)
        form = FeatureGroupForm(
            data={"name": group.name, "feature_permissions": [browse_data.id]},
            instance=group,
        )

        self.assertTrue(form.is_valid(), form.errors)
        form.save()

        group.refresh_from_db()
        self.assertTrue(group.permissions.filter(id=add_user.id).exists())
        self.assertTrue(group.permissions.filter(id=browse_data.id).exists())

    def test_user_can_disable_only_granted_feature_permissions(self):
        user = get_user_model().objects.create_user(
            username="toggle-user", password="pass12345"
        )
        grant(user, ("core", "browse_data"))
        self.client.force_login(user)

        response = self.client.patch(
            "/api/admin/profile/permissions/",
            data=json.dumps({"disabledPermissions": ["core.browse_data"]}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["user"]["permissions"]["canBrowseData"])

        response = self.client.patch(
            "/api/admin/profile/permissions/",
            data=json.dumps({"disabledPermissions": ["core.query_data"]}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("不能关闭未授予的权限", response.json()["detail"])

    def test_group_delete_requires_empty_group(self):
        manager = get_user_model().objects.create_user(
            username="group-manager", password="pass12345"
        )
        grant(manager, ("core", "manage_feature_permissions"))
        group = Group.objects.create(name="待删除用户组")
        user = get_user_model().objects.create_user(
            username="group-member", password="pass12345"
        )
        user.groups.add(group)
        self.client.force_login(manager)

        response = self.client.delete(f"/api/admin/groups/{group.id}/")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "用户组仍有关联用户，不能删除")

    def test_admin_can_create_user_when_registration_is_closed(self):
        SystemSetting.objects.update_or_create(
            pk=1, defaults={"allow_registration": False}
        )
        manager = get_user_model().objects.create_user(
            username="user-manager", password="pass12345"
        )
        grant(manager, ("core", "manage_feature_permissions"))
        group = Group.objects.create(name="科研用户")
        self.client.force_login(manager)

        response = self.client.post(
            "/api/admin/users/",
            data=json.dumps(
                {
                    "username": "created-by-admin",
                    "password": "StrongPass12345",
                    "displayName": "后台创建用户",
                    "email": "created@example.local",
                    "department": "生态监测组",
                    "groupIds": [group.id],
                    "isActive": True,
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(username="created-by-admin")
        self.assertEqual(user.email, "created@example.local")
        self.assertEqual(user.profile.department, "生态监测组")
        self.assertTrue(user.groups.filter(id=group.id).exists())

    def test_group_list_returns_available_feature_permissions(self):
        manager = get_user_model().objects.create_user(
            username="permission-list-manager", password="pass12345"
        )
        grant(manager, ("core", "manage_feature_permissions"))
        self.client.force_login(manager)

        response = self.client.get("/api/admin/groups/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        permission_ids = {
            permission["id"] for permission in payload["availablePermissions"]
        }
        self.assertIn("core.access_admin", permission_ids)
        self.assertIn("core.manage_feature_permissions", permission_ids)

    def test_admin_operation_logs_query_uses_real_audit_logs(self):
        manager = get_user_model().objects.create_user(
            username="log-manager", password="pass12345"
        )
        grant(manager, ("core", "access_admin"))
        OperationLog.objects.create(
            user=manager,
            module="系统设置",
            action="保存配置",
            status="success",
            message="写入运行配置",
        )
        OperationLog.objects.create(
            user=manager,
            module="认证授权",
            action="创建用户",
            status="failed",
            message="用户名重复",
        )
        self.client.force_login(manager)

        response = self.client.get(
            "/api/admin/operation-logs/",
            {"module": "系统设置", "result": "success"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["items"][0]["action"], "保存配置")


class StoragePathTests(SimpleTestCase):
    def test_research_path_rejects_parent_traversal(self):
        with self.assertRaises(StoragePathError):
            research_path("vector", "../secret.gpkg")
        with self.assertRaises(StoragePathError):
            research_path("gene", "../secret.fasta")

    def test_raster_paths_are_under_raster_root(self):
        self.assertTrue(
            str(raster_source_path("a.tif")).endswith("/raster/original/a.tif")
        )
        self.assertTrue(
            str(raster_processed_path("a.cog.tif")).endswith(
                "/raster/preprocessed/a.cog.tif"
            )
        )
        self.assertTrue(
            str(raster_metadata_path("source/a.tif.gdalinfo.json")).endswith(
                "/raster/metadata/source/a.tif.gdalinfo.json"
            )
        )

    def test_gene_and_table_paths_are_under_fixed_subdirectories(self):
        self.assertTrue(
            str(gene_data_path("sample.fasta")).endswith("/gene/sample.fasta")
        )
        self.assertTrue(
            str(table_data_path("survey.csv")).endswith("/table/survey.csv")
        )


class ConfigLoaderTests(SimpleTestCase):
    def test_loader_creates_fixed_data_subdirectories(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            config_path = root / "app.toml"
            business_root = root / "app"
            research_root = root / "research"
            config_path.write_text(
                f"""
[runtime]
debug = true
allowed_hosts = ["*"]
csrf_trusted_origins = []
gunicorn_bind = "127.0.0.1:8000"
gunicorn_workers = 1
http_port = 8000
disable_catalog_startup_scan = true
disable_raster_startup_scan = true

[application.system]
name = "测试系统"
allow_registration = true

[application.storage]
app_data = "{business_root}"
research_data_root = "{research_root}"

[application.map]
default_center = [80.0, 41.5]
default_zoom = 4.5
default_basemap = "osm"
mapbox_access_token = "pk.test-token"

[application.limits]
upload_max_mb = 512
query_result_limit = 30000

[application.raster]
symbolizer_timeout_seconds = 120
""",
                encoding="utf-8",
            )

            config = load_project_config(
                config_path, program_root=Path("/opt/data-sharing-platform")
            )

            self.assertTrue(config.app_path("database").is_dir())
            self.assertTrue(config.research_path("vector").is_dir())
            self.assertTrue(config.research_path("raster").is_dir())
            self.assertTrue(config.research_path("raster", "original").is_dir())
            self.assertTrue(config.research_path("raster", "preprocessed").is_dir())
            self.assertTrue(
                config.research_path("raster", "metadata", "source").is_dir()
            )
            self.assertTrue(
                config.research_path("raster", "metadata", "preprocessed").is_dir()
            )
            self.assertTrue(config.research_path("gene").is_dir())
            self.assertTrue(config.research_path("table").is_dir())

    def test_migration_helper_copies_source_config_to_appdata_runtime_config(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            config_path = root / "app.toml"
            business_root = root / "app"
            research_root = root / "research"
            config_path.write_text(
                f"""
[runtime]
debug = true
allowed_hosts = ["*"]
csrf_trusted_origins = []
gunicorn_bind = "127.0.0.1:8000"
gunicorn_workers = 1
http_port = 8000
disable_catalog_startup_scan = true
disable_raster_startup_scan = true

[application.system]
name = "测试系统"
allow_registration = true

[application.storage]
app_data = "{business_root}"
research_data_root = "{research_root}"

[application.map]
default_center = [80.0, 41.5]
default_zoom = 4.5
default_basemap = "osm"
mapbox_access_token = ""

[application.limits]
upload_max_mb = 512
query_result_limit = 30000

[application.raster]
symbolizer_timeout_seconds = 120
""",
                encoding="utf-8",
            )

            config = load_project_config(
                config_path, program_root=Path("/opt/data-sharing-platform")
            )
            copied = ensure_runtime_config_file(config)

            self.assertTrue(copied)
            self.assertEqual(
                config.runtime_config_path.read_text(), config_path.read_text()
            )

    def test_runtime_config_updates_are_written_with_tomlkit(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            config_path = root / "app.toml"
            business_root = root / "app"
            research_root = root / "research"
            config_path.write_text(
                f"""
[runtime]
debug = true
allowed_hosts = ["*"]
csrf_trusted_origins = []
gunicorn_bind = "127.0.0.1:8000"
gunicorn_workers = 1
http_port = 8000
disable_catalog_startup_scan = true
disable_raster_startup_scan = true

[application.system]
name = "测试系统"
allow_registration = true

[application.storage]
app_data = "{business_root}"
research_data_root = "{research_root}"

[application.map]
default_center = [80.0, 41.5]
default_zoom = 4.5
default_basemap = "osm"
mapbox_access_token = ""

[application.limits]
upload_max_mb = 512
query_result_limit = 30000

[application.raster]
symbolizer_timeout_seconds = 120
""",
                encoding="utf-8",
            )

            config = load_project_config(
                config_path, program_root=Path("/opt/data-sharing-platform")
            )
            update_runtime_application_config(
                config,
                {
                    "system": {"name": "更新后的系统"},
                    "map": {"default_center": [82.0, 42.0]},
                },
            )

            runtime_document = tomlkit.parse(
                config.runtime_config_path.read_text(encoding="utf-8")
            )
            source_document = tomlkit.parse(config_path.read_text(encoding="utf-8"))
            self.assertEqual(
                runtime_document["application"]["system"]["name"], "更新后的系统"
            )
            self.assertEqual(
                list(runtime_document["application"]["map"]["default_center"]),
                [82.0, 42.0],
            )
            self.assertEqual(
                source_document["application"]["system"]["name"], "测试系统"
            )


def grant(user, *specs):
    for app_label, codename in specs:
        permission = Permission.objects.get(
            content_type__app_label=app_label, codename=codename
        )
        user.user_permissions.add(permission)
