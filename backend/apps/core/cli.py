from __future__ import annotations

import os
import subprocess
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[3]


def pixi_environment_is_active(env: dict[str, str] | None = None) -> bool:
    active_env = os.environ if env is None else env
    return bool(
        active_env.get("PIXI_PROJECT_MANIFEST") or active_env.get("CONDA_PREFIX")
    )


def build_cli_command(
    command: list[str],
    *,
    env: dict[str, str] | None = None,
) -> list[str]:
    if pixi_environment_is_active(env):
        return [*command]
    return ["pixi", "run", "--executable", *command]


def run_cli_capture(
    command: list[str],
    *,
    cwd: Path = BACKEND_ROOT,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        build_cli_command(command, env=env),
        capture_output=True,
        text=True,
        check=False,
        env=env,
        cwd=cwd,
    )


def popen_cli(
    command: list[str],
    *,
    cwd: Path = BACKEND_ROOT,
    env: dict[str, str] | None = None,
    **kwargs,
) -> subprocess.Popen[str]:
    return subprocess.Popen(
        build_cli_command(command, env=env),
        cwd=cwd,
        env=env,
        **kwargs,
    )
