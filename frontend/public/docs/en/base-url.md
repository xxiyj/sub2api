# Base URL and Protocols

Token Life supports multiple client protocols. The most common mistake is adding a path twice.

## Protocol Mapping

| Protocol | Base URL | Authorization |
| --- | --- | --- |
| OpenAI-compatible API | `https://token-life.com/v1` | `Bearer <API Key>` |
| Anthropic Messages | `https://token-life.com` | `x-api-key` or the client's Anthropic auth flow |
| Gemini v1beta | `https://token-life.com` | Follow the Gemini client requirement |

## Why Does OpenAI Need `/v1`?

OpenAI-compatible paths usually look like:

```text
/v1/chat/completions
/v1/responses
/v1/models
```

So OpenAI-style clients usually need `https://token-life.com/v1`.

Anthropic Messages paths usually look like:

```text
/v1/messages
```

Claude Code appends the Anthropic path itself, so the Base URL should be `https://token-life.com`.

## Avoid Duplicate Paths

If the client already appends `/v1`, and you also enter `https://token-life.com/v1`, the final request may become:

```text
https://token-life.com/v1/v1/messages
```

If you see 404 errors, check for duplicate paths first.
