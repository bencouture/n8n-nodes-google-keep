# n8n-nodes-google-keep

An n8n community node for the [Google Keep API](https://developers.google.com/workspace/keep) (`keep.googleapis.com`).

Exposes three resources — **Note**, **Permission**, and **Attachment** — across
the operations the real Keep API supports: get/list, create, and delete
notes; add/list/remove note collaborators; and download a note's attachment.
There is no update/edit operation because the underlying API doesn't have one.

## Credential setup

Google Keep's API only supports access via a Google Workspace **service
account with domain-wide delegation** — there is no consumer 3-legged OAuth2
flow, unlike n8n's other Google nodes.

1. In Google Cloud Console, create a service account and download its JSON
   key. Enable the Keep API on that project.
2. As a Workspace admin, grant the service account domain-wide delegation
   with the scope `https://www.googleapis.com/auth/keep`.
3. In n8n, create a **Google Keep Service Account API** credential using:
   - **Service Account Email** — from the JSON key
   - **Private Key** — from the JSON key
   - **Delegated User Email** — the Workspace user to impersonate
4. Save and run the credential test. A clear error naming the
   Workspace/delegation requirement means the account isn't set up for
   domain-wide delegation yet.

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
