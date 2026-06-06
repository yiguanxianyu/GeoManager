from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


def password_validation_errors(password: str, *, user=None) -> list[str]:
    errors: list[str] = []
    if len(password) < 6:
        errors.append("密码长度至少 6 位")
    try:
        validate_password(password, user=user)
    except ValidationError as exc:
        errors.extend(str(message) for message in exc.messages)
    return list(dict.fromkeys(errors))
