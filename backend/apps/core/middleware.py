from django.http import HttpResponseForbidden

from apps.core.permissions import has_feature_perm, permission_denied_message


class AdminAccessPermissionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if (
            request.path.startswith("/admin/")
            and request.user.is_authenticated
            and not has_feature_perm(request.user, "core.access_admin")
        ):
            return HttpResponseForbidden(permission_denied_message(request.user))
        return self.get_response(request)
