from django.urls import path

from apps.core import admin_api, auth_views, views


urlpatterns = [
    path("bootstrap/", views.bootstrap, name="bootstrap"),
    path("health/", views.health, name="health"),
    path("auth/csrf/", auth_views.csrf_cookie, name="csrf"),
    path("auth/login/", auth_views.login_view, name="login"),
    path("auth/register/", auth_views.register_view, name="register"),
    path("auth/logout/", auth_views.logout_view, name="logout"),
    path("auth/me/", auth_views.me_view, name="me"),
    path(
        "admin/operation-logs/",
        admin_api.admin_operation_logs,
        name="admin-operation-logs",
    ),
    path("admin/profile/", admin_api.admin_profile, name="admin-profile"),
    path(
        "admin/profile/update/",
        admin_api.update_admin_profile,
        name="admin-profile-update",
    ),
    path(
        "admin/profile/permissions/",
        admin_api.update_admin_profile_permissions,
        name="admin-profile-permissions",
    ),
    path("admin/users/", admin_api.admin_users, name="admin-users"),
    path(
        "admin/users/<int:user_id>/groups/",
        admin_api.update_admin_user_groups,
        name="admin-user-groups",
    ),
    path("admin/groups/", admin_api.admin_groups, name="admin-groups"),
    path(
        "admin/groups/<int:group_id>/",
        admin_api.admin_group_detail,
        name="admin-group-detail",
    ),
    path("admin/settings/", admin_api.admin_settings, name="admin-settings"),
]
