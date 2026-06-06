from django.apps import AppConfig

_startup_credentials_printed = False


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    verbose_name = "系统核心"

    def ready(self):
        global _startup_credentials_printed
        from django.db.models.signals import post_migrate

        from apps.core.initialization import (
            ensure_superadmin_defaults_after_migrate,
            print_superadmin_credentials_on_startup,
        )

        post_migrate.connect(
            ensure_superadmin_defaults_after_migrate,
            sender=self,
            dispatch_uid="apps.core.ensure_superadmin_defaults",
        )
        if not _startup_credentials_printed:
            _startup_credentials_printed = True
            print_superadmin_credentials_on_startup()
