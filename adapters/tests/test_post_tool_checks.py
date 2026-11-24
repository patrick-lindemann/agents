from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

_REPO_DIR = Path(__file__).resolve().parents[2]
_CHECKER_FILE = _REPO_DIR / "adapters" / "post_tool_checks.py"
_FIXTURE_FILE = Path(__file__).with_name("fixtures") / "checker.py"


class PostEditChecksTest(unittest.TestCase):
    scratch: Path
    project: Path
    bin_dir: Path

    def setUp(self) -> None:
        scratch = TemporaryDirectory()
        self.addCleanup(scratch.cleanup)
        self.scratch = Path(scratch.name).resolve()
        self.project = self.scratch / "project"
        self.project.mkdir()
        self.bin_dir = self.scratch / "bin"
        self.bin_dir.mkdir()

    def test_claude_limits_checks_to_a_configured_edited_file(self) -> None:
        self._install_checker(self.bin_dir / "biome")
        (self.project / "biome.json").write_text("{}", encoding="utf-8")
        edited_file = self.project / "edited.ts"
        edited_file.touch()
        (self.project / "other.ts").touch()
        event = {"tool_name": "Write", "tool_input": {"file_path": str(edited_file)}}

        report = self._run_hook("claude", event)

        self.assertEqual([call["args"][-2:] for call in self._calls(report)], [["--", "edited.ts"]])

    def test_claude_discovers_each_checker_independently_and_stops_at_the_workspace(self) -> None:
        self._install_checker(self.bin_dir / "ruff")
        (self.scratch / "ruff.toml").touch()
        (self.project / "pyproject.toml").write_text("[tool.ty]\n", encoding="utf-8")
        (self.project / "edited.py").touch()
        event = {"tool_name": "Edit", "tool_input": {"file_path": "edited.py"}}

        report = self._run_hook("claude", event)

        self.assertNotIn("ruff", report)
        self.assertIn("Cannot find `ty`", report)

    def test_claude_ignores_a_project_binary_when_it_is_not_on_path(self) -> None:
        self._install_checker(self.project / "node_modules/.bin/biome")
        (self.project / "biome.json").write_text("{}", encoding="utf-8")
        (self.project / "edited.ts").touch()
        event = {"tool_name": "Edit", "tool_input": {"file_path": "edited.ts"}}

        report = self._run_hook("claude", event)

        self.assertIn("Cannot find `biome`", report)
        self.assertEqual(self._calls(report), [])

    def test_claude_skips_failed_edits_and_bash(self) -> None:
        self._install_checker(self.bin_dir / "biome")
        (self.project / "biome.json").write_text("{}", encoding="utf-8")
        (self.project / "edited.ts").touch()
        tool_input = {"file_path": "edited.ts"}
        cases = {
            "failure": {"tool_name": "Edit", "hook_event_name": "PostToolUseFailure"},
            "bash": {"tool_name": "Bash"},
        }

        for name, event in cases.items():
            with self.subTest(name=name):
                self.assertEqual(self._run_hook("claude", {**event, "tool_input": tool_input}), "")

    def test_codex_checks_patch_destinations_in_one_batch_per_command(self) -> None:
        self._install_checker(self.bin_dir / "ruff")
        self._install_checker(self.bin_dir / "ty")
        (self.project / "pyproject.toml").write_text("[tool.ruff.lint]\n[tool.ty.rules]\n", encoding="utf-8")
        (self.project / "added.py").touch()
        (self.project / "moved file.py").touch()
        (self.project / "deleted.py").touch()
        outside_file = self.scratch / "outside.py"
        outside_file.touch()
        (self.project / "linked.py").symlink_to(outside_file)
        event = {
            "tool_name": "apply_patch",
            "tool_input": {
                "command": (
                    "*** Begin Patch\n"
                    "*** Add File: added.py\n"
                    "*** Update File: old.py\n"
                    "*** Move to: moved file.py\n"
                    "*** Delete File: deleted.py\n"
                    "*** Add File: linked.py\n"
                    "*** End Patch"
                ),
            },
            "tool_response": "Output:\nSuccess. Updated the following files:\nA added.py\nM old.py\nD deleted.py\n",
        }

        calls = self._calls(self._run_hook("codex", event))

        self.assertEqual(len(calls), 3)
        self.assertEqual([call["args"][-3:] for call in calls], [["--", "added.py", "moved file.py"]] * 3)
        self.assertEqual(self._run_hook("codex", {**event, "tool_response": "Patch failed"}), "")

    def test_pi_deduplicates_paths_and_uses_the_nearest_config_and_local_binary(self) -> None:
        nested = self.project / "nested"
        nested.mkdir()
        for root in (self.project, nested):
            self._install_checker(root / "node_modules/.bin/biome")
            (root / "biome.json").write_text("{}", encoding="utf-8")
            (root / "-edited.ts").touch()
        self._install_checker(self.bin_dir / "biome")

        report = self._run("pi", "--", "-edited.ts", "nested/-edited.ts", str(nested / "-edited.ts"))
        calls = self._calls(report)

        self.assertEqual([call["cwd"] for call in calls], [str(self.project), str(nested)])
        self.assertEqual([call["args"][-2:] for call in calls], [["--", "-edited.ts"]] * 2)
        self.assertTrue(all(Path(call["binary"]).is_relative_to(self.project) for call in calls))

    def test_installer_preserves_existing_hooks_and_does_not_register_duplicates(self) -> None:
        checkout = self.scratch / "checkout"
        scripts_dir = checkout / "scripts"
        scripts_dir.mkdir(parents=True)
        (checkout / "skills").mkdir()
        (checkout / "adapters/pi/extensions/checks").mkdir(parents=True)
        installer = scripts_dir / "install.py"
        shutil.copyfile(_REPO_DIR / "scripts" / "install.py", installer)
        home = self.scratch / "home"
        dirs = {name: home / name for name in ("claude", "codex", "pi")}
        for config_dir in dirs.values():
            config_dir.mkdir(parents=True)
        files = {"claude": dirs["claude"] / "settings.json", "codex": dirs["codex"] / "hooks.json"}
        existing = {"matcher": "^Bash$", "hooks": [{"type": "command", "command": "existing"}]}
        for hooks_file in files.values():
            hooks_file.write_text(json.dumps({"keep": True, "hooks": {"PostToolUse": [existing]}}), encoding="utf-8")
        env = os.environ | {
            "HOME": str(home),
            "CLAUDE_CONFIG_DIR": str(dirs["claude"]),
            "CODEX_HOME": str(dirs["codex"]),
            "PI_CODING_AGENT_DIR": str(dirs["pi"]),
        }
        command = [sys.executable, str(installer), "--harness", "claude,codex,pi"]

        subprocess.run(command, capture_output=True, text=True, check=True, env=env)
        second_install = subprocess.run(command, capture_output=True, text=True, check=True, env=env)

        self.assertNotIn("PostToolUse", second_install.stdout)
        for harness, hooks_file in files.items():
            config = json.loads(hooks_file.read_text(encoding="utf-8"))
            self.assertTrue(config["keep"])
            preserved, installed = config["hooks"]["PostToolUse"]
            self.assertEqual(preserved, existing)
            self.assertEqual(
                installed["hooks"][0]["command"], f'python3 "$HOME/agents/adapters/post_tool_checks.py" {harness}'
            )
        self.assertEqual(
            (dirs["pi"] / "extensions/agents-checks").resolve(), checkout / "adapters/pi/extensions/checks"
        )

    def _install_checker(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        fixture = _FIXTURE_FILE.read_text(encoding="utf-8")
        path.write_text(f"#!{sys.executable}\n{fixture}", encoding="utf-8")
        path.chmod(0o755)

    def _run_hook(self, harness: str, event: dict[str, object]) -> str:
        payload = {"cwd": str(self.project), "hook_event_name": "PostToolUse", **event}
        result = self._run(harness, stdin=json.dumps(payload))
        return json.loads(result)["hookSpecificOutput"]["additionalContext"] if result else ""

    def _run(self, *args: str, stdin: str = "") -> str:
        result = subprocess.run(
            [sys.executable, str(_CHECKER_FILE), *args],
            input=stdin,
            capture_output=True,
            text=True,
            check=False,
            cwd=self.project,
            env=os.environ | {"PATH": str(self.bin_dir)},
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr, "")
        return result.stdout

    def _calls(self, report: str) -> list[dict[str, Any]]:
        return [json.loads(line) for line in report.splitlines() if line.startswith("{")]
