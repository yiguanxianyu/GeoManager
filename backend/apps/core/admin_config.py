from django.contrib.admin.apps import AdminConfig


class HuyangAdminConfig(AdminConfig):
    default_site = "apps.core.admin_site.HuyangAdminSite"

