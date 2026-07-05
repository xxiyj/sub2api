# Codex CLI Setup

When Codex CLI uses an OpenAI-compatible provider, the Base URL should include `/v1`.

## Environment Variables

macOS / Linux:

```bash
export OPENAI_BASE_URL="https://token-life.com/v1"
export OPENAI_API_KEY="your Token Life API key"
```

Windows PowerShell:

```powershell
$env:OPENAI_BASE_URL="https://token-life.com/v1"
$env:OPENAI_API_KEY="your Token Life API key"
```

## Config File Example

If your Codex CLI uses a config file, set up an OpenAI-compatible provider:

```toml
[model_providers.token_life]
name = "Token Life"
base_url = "https://token-life.com/v1"
env_key = "OPENAI_API_KEY"

[profiles.token_life]
model_provider = "token_life"
model = "gpt-4.1"
```

> Config fields may vary across Codex CLI versions. The key point is: use an OpenAI-compatible provider, set the Base URL to `https://token-life.com/v1`, and use your Token Life API key.

## Verify

Start Codex CLI and run a simple task. Then check usage records in the Token Life console.

## Common Errors

| Error | Possible Cause | Fix |
| --- | --- | --- |
| 401 | Missing or invalid API key | Copy the key again from the console |
| 403 | The group lacks model permission | Check the key's group |
| 404 | Wrong Base URL or model name | Confirm `/v1` is used |
| 429 | Rate limit or quota issue | Reduce concurrency or check balance |
