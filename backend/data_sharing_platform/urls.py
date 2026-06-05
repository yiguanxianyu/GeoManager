from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path, re_path


def redirect_legacy_admin(request, path=""):
    suffix = path if not path or path.endswith("/") else f"{path}/"
    query = request.META.get("QUERY_STRING")
    target = f"/admin2/{suffix}"
    if query:
        target = f"{target}?{query}"
    return redirect(target)


urlpatterns = [
    path("admin2/", admin.site.urls),
    re_path(r"^admin(?:/(?P<path>.*))?$", redirect_legacy_admin),
    path("api/", include("apps.core.urls")),
    path("api/", include("apps.catalog.urls")),
    path("api/raster/", include("apps.raster.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
