# CC Switch Import

CC Switch can import provider settings directly from the Token Life console. After import, it will carry the Base URL, API key, and provider name automatically, so you do not need to copy multiple fields by hand.

## 1. Click Import on the API Keys Page

Open the API Keys page in the Token Life console, find the API key you want to use for Claude Code or Codex, and click `Import to CCS` in the actions column.

![Import to CCS](../assets/cc-switch-import-action.png)

## 2. Confirm the Import

CC Switch will open a confirmation dialog. Check the provider name, official website, API endpoint, and API key.

![Confirm CC Switch Import](../assets/cc-switch-import-confirm.png)

Click `Import` after confirming the details. You can edit or delete the provider later in CC Switch.

## 3. Import Parameters

| Field | Recommended Value |
| --- | --- |
| App Type | `Claude` |
| Provider Name | `Token Life` |
| Official Website | `https://token-life.com` |
| API Endpoint | `https://token-life.com` |
| API Key | API key created in the Token Life console |

## 4. Usage Notes

If you mainly use Claude Code, keep the Token Life provider as Claude type in CC Switch. Claude Code uses `https://token-life.com` as the Base URL, without `/v1`.

If you also use the same key in an OpenAI-compatible client, configure that client with `https://token-life.com/v1`.
