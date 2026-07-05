# FAQ

## What is Token Life?

Token Life is an AI API access platform for developers and teams. You can manage API keys, balance, request records, and access to multiple model families from one console.

## Can One API Key Use Multiple Model Groups?

Yes, as long as the console grants the key or account access to the corresponding groups. The client still needs to use the correct protocol and Base URL.

## How Are Codex Groups Related to OpenAI Type?

If a group is named Codex but uses an OpenAI-compatible protocol, configure the client as OpenAI-compatible and use `https://token-life.com/v1`.

## Why Does Claude Code Fail After Import?

Common reasons:

1. `ANTHROPIC_BASE_URL` did not take effect.
2. The API key is wrong or contains extra spaces.
3. The key's group does not have Claude model permission.
4. The model name is not enabled in the console.

## Why Do Requests Return 401?

401 usually means authentication failed. Copy the API key again and make sure the client is using the Token Life key.

## Why Do Requests Return 403?

403 usually means insufficient permission. Check whether the key's group can access the selected model.

## Why Do Requests Return 404?

404 is often caused by a wrong Base URL or model name. OpenAI-compatible clients use `https://token-life.com/v1`; Claude Code uses `https://token-life.com`.

## Why Do Requests Return 429?

429 usually means request frequency, concurrency, quota, balance, or upstream rate limit issues. Reduce concurrency and check balance and channel status.

## How Do I Confirm Billing?

After a request completes, check usage records and balance changes in the console. If the record exists, the request reached the Token Life gateway.
