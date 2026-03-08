#!/usr/bin/env python3
"""
OpenRouter/OpenAI-compatible JSON chat client for subagents.
"""

from __future__ import annotations

import json
import os
import random
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class LLMClientError(RuntimeError):
    def __init__(self, code: str, message: str, metadata: dict[str, Any] | None = None):
        super().__init__(f"{code}: {message}")
        self.code = code
        self.metadata = metadata or {}


@dataclass
class LLMClientConfig:
    provider: str
    base_url: str
    model_writer: str
    model_critic: str
    model_orchestrator: str
    temperature_writer: float
    temperature_critic: float
    temperature_orchestrator: float
    max_tokens_writer: int
    max_tokens_critic: int
    max_tokens_orchestrator: int
    json_only: bool
    request_timeout_s: int
    request_retries: int


def _load_dotenv_if_present(config_dir: Path) -> None:
    """
    Lightweight .env loader to avoid requiring external dependencies.
    Loads variables only when they are not already set in process env.
    """
    candidates = []
    try:
        candidates.append((Path.cwd() / ".env").resolve())
    except Exception:
        pass
    try:
        # Repo root when config_dir is in-repo: subagents/config
        candidates.append((config_dir.resolve().parents[1] / ".env").resolve())
    except Exception:
        pass
    try:
        # Fallback to this script's repo root
        candidates.append((Path(__file__).resolve().parents[1] / ".env").resolve())
    except Exception:
        pass

    seen: set[Path] = set()
    for env_path in candidates:
        if env_path in seen:
            continue
        seen.add(env_path)
        if not env_path.exists():
            continue
        try:
            raw = env_path.read_text(encoding="utf-8")
        except OSError:
            continue

        for line in raw.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("export "):
                line = line[len("export ") :].strip()
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            if not key:
                continue
            if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
            os.environ.setdefault(key, value)


def load_pipeline_config(config_dir: Path) -> tuple[LLMClientConfig, dict[str, Any]]:
    path = config_dir / "pipeline.json"
    with path.open("r", encoding="utf-8") as f:
        raw = json.load(f)
    cfg = LLMClientConfig(
        provider=str(raw.get("provider", "openrouter")),
        base_url=str(raw.get("base_url", "https://openrouter.ai/api/v1")).rstrip("/"),
        model_writer=str(raw.get("model_writer", "openai/gpt-4.1-mini")),
        model_critic=str(raw.get("model_critic", "openai/gpt-4.1-mini")),
        model_orchestrator=str(raw.get("model_orchestrator", raw.get("model_critic", "openai/gpt-4.1-mini"))),
        temperature_writer=float(raw.get("temperature_writer", 0.3)),
        temperature_critic=float(raw.get("temperature_critic", 0.1)),
        temperature_orchestrator=float(raw.get("temperature_orchestrator", raw.get("temperature_critic", 0.1))),
        max_tokens_writer=int(raw.get("max_tokens_writer", 16000)),
        max_tokens_critic=int(raw.get("max_tokens_critic", 16000)),
        max_tokens_orchestrator=int(raw.get("max_tokens_orchestrator", 4000)),
        json_only=bool(raw.get("json_only", True)),
        request_timeout_s=int(raw.get("request_timeout_s", 45)),
        request_retries=max(1, int(raw.get("request_retries", 1))),
    )
    return cfg, raw


def _extract_json_block(text: str) -> str:
    text = text.strip()
    if not text:
        raise LLMClientError("EMPTY_RESPONSE", "Model returned empty content.")
    if text.startswith("{") or text.startswith("["):
        return text
    start_obj = text.find("{")
    start_arr = text.find("[")
    starts = [x for x in [start_obj, start_arr] if x >= 0]
    if not starts:
        raise LLMClientError("NO_JSON", "Could not locate JSON in model output.", {"preview": text[:200]})
    start = min(starts)
    candidate = text[start:].strip()
    return candidate


class SubagentLLMClient:
    def __init__(self, config_dir: Path):
        _load_dotenv_if_present(config_dir)
        self.config, self.raw_config = load_pipeline_config(config_dir)
        key = os.getenv("OPENROUTER_API_KEY", "").strip()
        if not key:
            raise LLMClientError("MISSING_API_KEY", "OPENROUTER_API_KEY is required for LLM stages.")
        self.api_key = key
        self.base_url = os.getenv("OPENROUTER_BASE_URL", self.config.base_url).rstrip("/")

    def _chat_json(
        self,
        *,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: str,
        user_payload: dict[str, Any],
        retries: int | None = None,
    ) -> dict[str, Any]:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
            ],
        }
        if self.config.json_only:
            payload["response_format"] = {"type": "json_object"}

        body = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://local.codex",
            "X-Title": "SahWla Question Subagents",
        }

        last_error: Exception | None = None
        effective_retries = retries if retries is not None else self.config.request_retries
        for attempt in range(1, effective_retries + 1):
            req = urllib.request.Request(url=url, method="POST", data=body, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=self.config.request_timeout_s) as resp:
                    data = resp.read().decode("utf-8")
                parsed = json.loads(data)
                choices = parsed.get("choices", [])
                if not choices:
                    raise LLMClientError("NO_CHOICES", "Provider returned no choices.", {"raw": parsed})
                message = choices[0].get("message", {})
                content = message.get("content", "")
                if isinstance(content, list):
                    # OpenAI-style content parts
                    merged = []
                    for part in content:
                        if isinstance(part, dict) and part.get("type") == "text":
                            merged.append(str(part.get("text", "")))
                    content = "\n".join(merged)
                content = str(content)
                json_text = _extract_json_block(content)
                try:
                    return json.loads(json_text)
                except json.JSONDecodeError:
                    repaired = self._repair_json(
                        model=model,
                        invalid_json_text=json_text,
                        max_tokens=max_tokens,
                    )
                    if repaired is not None:
                        return repaired
                    raise LLMClientError("INVALID_JSON", "Model output is not valid JSON.", {"text": json_text[:500]})
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, LLMClientError) as exc:
                last_error = exc
                if attempt >= effective_retries:
                    break
                backoff = (2 ** (attempt - 1)) + random.uniform(0.0, 0.3)
                time.sleep(backoff)

        if isinstance(last_error, LLMClientError):
            raise last_error
        raise LLMClientError("REQUEST_FAILED", "LLM request failed.", {"error": str(last_error)})

    def _repair_json(self, *, model: str, invalid_json_text: str, max_tokens: int) -> dict[str, Any] | None:
        """
        Best-effort repair pass: ask model to output only valid JSON with same intent.
        """
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": model,
            "temperature": 0,
            "max_tokens": min(max_tokens, 4000),
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You fix malformed JSON. Return only valid JSON matching the user's structure. "
                        "No markdown, no comments."
                    ),
                },
                {
                    "role": "user",
                    "content": invalid_json_text,
                },
            ],
            "response_format": {"type": "json_object"},
        }
        body = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://local.codex",
            "X-Title": "SahWla Question Subagents",
        }
        req = urllib.request.Request(url=url, method="POST", data=body, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = resp.read().decode("utf-8")
            parsed = json.loads(data)
            choices = parsed.get("choices", [])
            if not choices:
                return None
            content = choices[0].get("message", {}).get("content", "")
            if isinstance(content, list):
                merged = []
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        merged.append(str(part.get("text", "")))
                content = "\n".join(merged)
            json_text = _extract_json_block(str(content))
            return json.loads(json_text)
        except Exception:
            return None

    def writer_json(self, system_prompt: str, user_payload: dict[str, Any]) -> dict[str, Any]:
        return self._chat_json(
            model=self.config.model_writer,
            temperature=self.config.temperature_writer,
            max_tokens=self.config.max_tokens_writer,
            system_prompt=system_prompt,
            user_payload=user_payload,
        )

    def critic_json(self, system_prompt: str, user_payload: dict[str, Any]) -> dict[str, Any]:
        return self._chat_json(
            model=self.config.model_critic,
            temperature=self.config.temperature_critic,
            max_tokens=self.config.max_tokens_critic,
            system_prompt=system_prompt,
            user_payload=user_payload,
        )

    def orchestrator_json(self, system_prompt: str, user_payload: dict[str, Any]) -> dict[str, Any]:
        return self._chat_json(
            model=self.config.model_orchestrator,
            temperature=self.config.temperature_orchestrator,
            max_tokens=self.config.max_tokens_orchestrator,
            system_prompt=system_prompt,
            user_payload=user_payload,
        )
