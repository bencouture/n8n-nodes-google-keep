# n8n-nodes-google-keep

An n8n community node for the [Google Keep API](https://developers.google.com/workspace/keep) (`keep.googleapis.com`).

Exposes three resources — **Note**, **Permission**, and **Attachment** — across
the operations the real Keep API supports: get/list, create, and delete
notes; add/list/remove note collaborators; and download a note's attachment.
There is no update/edit operation because the underlying API doesn't have one.

> [!IMPORTANT]
> **This only works with a paid Google Workspace account.** The Keep API is
> not available to personal/consumer Google accounts (`@gmail.com`) at all —
> there is no setup, workaround, or credential type that makes it work on a
> free consumer account. You need:
> - A **Google Workspace** subscription (Business/Enterprise) for the account whose notes you want to access, and
> - A **Workspace admin** (or an account with delegated admin privileges) who can grant domain-wide delegation — a regular Workspace user without admin rights can't complete setup on their own.
>
> If you're trying to use this with a personal Gmail account, stop here — it will not work no matter how the credential is configured.

## Credential setup

Google Keep's API only supports access via a Google Workspace **service
account with domain-wide delegation** — there is no consumer 3-legged OAuth2
flow, unlike n8n's other Google nodes. This means you need a **Service
Account**, not an **OAuth 2.0 Client ID** — those are two different objects
in Google Cloud Console and only one of them works here:

| | Service Account | OAuth 2.0 Client ID |
|---|---|---|
| Where | IAM & Admin → Service Accounts | APIs & Services → Credentials → "+ Create Credentials" → OAuth client ID |
| Has a private key? | Yes (downloadable JSON) | No — only `client_id` + `client_secret` |
| Supports domain-wide delegation? | Yes | No |

If you already created an OAuth 2.0 Client ID, it won't work for this node — create a Service Account instead.

### 1. Create the service account and download its key

1. In [Google Cloud Console](https://console.cloud.google.com/), open **IAM & Admin → Service Accounts** and create a new service account.
2. On that service account, open the **Keys** tab → **Add Key → Create new key → JSON**, and download it. This JSON file contains `client_email` and `private_key` — the two values you'll paste into n8n.
3. Also note the service account's **Client ID** (a long number, e.g. `123456789012345678901`), shown in its details panel — you'll need it for domain-wide delegation, not its email.
4. In the same GCP project, go to **APIs & Services → Library**, search for **Google Keep API**, and enable it.

### 2. Grant domain-wide delegation (as a Workspace admin)

1. Go to [admin.google.com](https://admin.google.com/) → **Security → Access and data control → API controls → Domain-wide delegation**.
2. Click **Add new**, and enter:
   - **Client ID**: the service account's numeric Client ID from step 1.3 (not its email)
   - **OAuth scopes**: exactly `https://www.googleapis.com/auth/keep` — this single scope covers every operation this node supports (get/list/create/delete notes, permissions, and attachment download). Don't add `keep.readonly` as well; it doesn't add anything and this node needs write access.
3. Save. Changes are usually live within a few minutes, though Google says it can take up to 24 hours.

### 3. Create the credential in n8n

Create a **Google Keep Service Account API** credential using:
- **Service Account Email** — `client_email` from the JSON key
- **Private Key** — `private_key` from the JSON key (paste it as-is; the node reconstructs the PEM even if your browser strips the line breaks on paste)
- **Delegated User Email** — a real, active Workspace user in the same domain to impersonate (not a personal Gmail address, alias, or group)

Save and run the credential test. If it fails, see Troubleshooting below — the error message is Google's own, passed through verbatim, rather than a generic auth failure.

### Troubleshooting

**`error:1E08010C:DECODER routines::unsupported`**
The Private Key field is a masked, single-line input, and some browsers strip line breaks when you paste a multi-line PEM key into it. This node reconstructs the PEM automatically regardless of how it got mangled on paste — if you still see this, double-check you copied the entire `private_key` value from the JSON file (including both `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers).

**`unauthorized_client: Client is unauthorized to retrieve access tokens using this method, or client not authorized for any of the scopes requested`**
Domain-wide delegation isn't fully configured yet. Check, in order:
1. The Client ID registered in the Admin console's domain-wide delegation page is the **service account's numeric Client ID**, not its email or an unrelated OAuth client's ID.
2. The scope is exactly `https://www.googleapis.com/auth/keep` — no typos, no trailing whitespace.
3. The Delegated User Email is a real, active user in that same Workspace domain.
4. The Google Keep API is enabled on the GCP project that owns this service account.
5. It's only been a few minutes since you saved the delegation — give it a little time and retry.

## Usage

Add the **Google Keep** node, pick a **Resource** (Note / Permission /
Attachment), then an **Operation**:

| Resource | Operations |
|---|---|
| Note | Get, Get Many, Create, Delete |
| Permission | Add, List, Remove |
| Attachment | Download |

See [`specs/001-google-keep-node/quickstart.md`](specs/001-google-keep-node/quickstart.md)
for a step-by-step validation walkthrough against a real Keep account.

## Development

```bash
npm install
npm run build   # compiles TypeScript and copies icon assets to dist/
npm test        # runs the Jest suite
npm run lint    # eslint-plugin-n8n-nodes-base
```

## License

Copyright (C) 2026 Ben Couture

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
[GNU General Public License](LICENSE) for more details.
