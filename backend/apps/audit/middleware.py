from __future__ import annotations

from typing import Any

from django.utils import timezone

from apps.audit.models import UserActivityHour

SESSION_ACTIVITY_MARKER = "_geomanager_activity_hour"


class UserActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        recorded_before_response = record_user_activity(request)
        response = self.get_response(request)
        if not recorded_before_response:
            record_user_activity(request)
        return response


def record_user_activity(request: Any, *, now=None) -> bool:
    user = getattr(request, "user", None)
    if not getattr(user, "is_authenticated", False):
        return False
    if not str(getattr(request, "path", "")).startswith("/api/"):
        return False

    bucket_start = _activity_hour_start(now)
    marker = f"{user.pk}:{bucket_start.isoformat()}"
    session = getattr(request, "session", None)
    if session is not None and session.get(SESSION_ACTIVITY_MARKER) == marker:
        return True

    UserActivityHour.objects.get_or_create(user=user, bucket_start=bucket_start)
    if session is not None:
        session[SESSION_ACTIVITY_MARKER] = marker
    return True


def _activity_hour_start(value=None):
    current = timezone.localtime(value or timezone.now())
    return current.replace(minute=0, second=0, microsecond=0)
