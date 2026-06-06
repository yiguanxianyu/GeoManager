from django import forms
from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as DjangoGroupAdmin
from django.contrib.auth.models import Group, Permission

from apps.core.initialization import (
    is_superadmin_group,
    is_superadmin_user,
    protected_group_permissions,
    superadmin_group_locked_permissions,
)
from apps.core.models import SystemSetting, UserProfile
from apps.core.permissions import (
    feature_permission_ids_for,
    feature_permission_queryset,
    has_feature_perm,
)


class FeatureGroupForm(forms.ModelForm):
    feature_permissions = forms.ModelMultipleChoiceField(
        label="平台功能权限",
        queryset=Permission.objects.none(),
        required=False,
        widget=admin.widgets.FilteredSelectMultiple("平台功能权限", is_stacked=False),
    )

    class Meta:
        model = Group
        fields = ("name", "feature_permissions")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        queryset = feature_permission_queryset().order_by(
            "content_type__app_label", "codename"
        )
        self.fields["feature_permissions"].queryset = queryset
        if self.instance.pk:
            self.fields[
                "feature_permissions"
            ].initial = self.instance.permissions.filter(id__in=queryset)

    def save(self, commit=True):
        group = super().save(commit=commit)
        if commit:
            selected = _selected_feature_permission_ids(group, self.cleaned_data)
            feature_ids = set(
                feature_permission_queryset().values_list("id", flat=True)
            )
            current_non_feature = set(
                group.permissions.exclude(id__in=feature_ids).values_list(
                    "id", flat=True
                )
            )
            group.permissions.set([*current_non_feature, *selected])
        return group


admin.site.unregister(Group)


@admin.register(Group)
class FeatureGroupAdmin(DjangoGroupAdmin):
    form = FeatureGroupForm
    fields = ("name", "feature_permissions")
    list_display = ("name", "feature_permission_count")
    search_fields = ("name",)

    @admin.display(description="平台功能权限数")
    def feature_permission_count(self, obj):
        return len(feature_permission_ids_for(obj))

    def has_module_permission(self, request):
        return has_feature_perm(request.user, "core.manage_feature_permissions")

    def has_view_permission(self, request, obj=None):
        return has_feature_perm(request.user, "core.manage_feature_permissions")

    def has_add_permission(self, request):
        return has_feature_perm(request.user, "core.manage_feature_permissions")

    def has_change_permission(self, request, obj=None):
        return has_feature_perm(request.user, "core.manage_feature_permissions")

    def has_delete_permission(self, request, obj=None):
        if obj and is_superadmin_group(obj):
            return False
        return has_feature_perm(request.user, "core.manage_feature_permissions")


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    fields = ("allow_registration", "updated_at")
    list_display = ("allow_registration", "updated_at")
    readonly_fields = ("updated_at",)

    def has_module_permission(self, request):
        return has_feature_perm(request.user, "core.access_admin")

    def has_view_permission(self, request, obj=None):
        return has_feature_perm(request.user, "core.access_admin")

    def has_add_permission(self, request):
        return not SystemSetting.objects.exists() and has_feature_perm(
            request.user, "core.access_admin"
        )

    def has_change_permission(self, request, obj=None):
        return has_feature_perm(request.user, "core.access_admin")

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        obj.pk = 1
        super().save_model(request, obj, form, change)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    fields = ("user", "avatar_url", "department", "disabled_permissions", "updated_at")
    list_display = ("user", "department", "updated_at")
    readonly_fields = ("updated_at",)
    search_fields = ("user__username", "user__email", "department")

    def has_module_permission(self, request):
        return has_feature_perm(request.user, "core.access_admin")

    def has_view_permission(self, request, obj=None):
        return has_feature_perm(request.user, "core.access_admin")

    def has_add_permission(self, request):
        return has_feature_perm(request.user, "core.access_admin")

    def has_change_permission(self, request, obj=None):
        return has_feature_perm(request.user, "core.access_admin")

    def has_delete_permission(self, request, obj=None):
        return has_feature_perm(request.user, "core.access_admin")

    def save_model(self, request, obj, form, change):
        if is_superadmin_user(obj.user):
            disabled = set(obj.disabled_permissions)
            obj.disabled_permissions = sorted(
                disabled - superadmin_group_locked_permissions()
            )
        super().save_model(request, obj, form, change)


def _selected_feature_permission_ids(group: Group, cleaned_data) -> set[int]:
    if not is_superadmin_group(group):
        return set(cleaned_data["feature_permissions"].values_list("id", flat=True))

    permission_names = protected_group_permissions()
    app_labels = {name.split(".", 1)[0] for name in permission_names}
    codenames = {name.split(".", 1)[1] for name in permission_names}
    return set(
        feature_permission_queryset()
        .filter(content_type__app_label__in=app_labels, codename__in=codenames)
        .values_list("id", flat=True)
    )
