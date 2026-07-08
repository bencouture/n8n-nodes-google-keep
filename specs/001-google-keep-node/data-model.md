# Phase 1 Data Model: Google Keep n8n Node

These map spec Key Entities to the fields the node reads/writes. Field names
follow the real Keep API response shape (`keep.googleapis.com`); no fields
are invented beyond what the API returns.

## Note

Represents a single Keep note (Notes.get / list / create / delete).

| Field | Type | Notes |
|---|---|---|
| `name` | string | Resource name, e.g. `notes/{note_id}`; treated as the note ID |
| `title` | string | Optional on create |
| `body.text.text` | string | Present when the note is plain text |
| `body.list.listItems[]` | array | Present when the note is a checklist; each item has `text` and `checked` |
| `createTime` | string (RFC3339) | Read-only |
| `updateTime` | string (RFC3339) | Read-only |
| `trashed` / `trashTime` | bool / string | Read-only; surfaced so a "Get"/"Get Many" result can indicate trashed state |
| `attachments[]` | array | Attachment references (see below); populated on get/list, consumed by the Attachment resource |

**Validation rules** (FR-004): on Create, `title` or body content MUST be
present; body is either free text or a list of checklist item strings, not
both (matches the API's `body.text` / `body.list` union).

**State transitions**: Create → (optionally shared via Permission) → Delete.
No update transition exists (FR-010).

## Attachment

Binary media referenced by a Note; not a standalone resource in Keep's API,
but downloaded via `media.download` using a note's attachment reference.

| Field | Type | Notes |
|---|---|---|
| `name` | string | Attachment resource name, read from the parent note's `attachments[]` |
| `mimeType` | string | Selects the requested download variant |
| binary content | bytes | Returned by `media.download`, attached to the output item as n8n binary data |

**Validation rules** (FR-009): download requires a note that has at least
one attachment; absence MUST produce a clear "no attachment found" error
(per spec Edge Cases), not an empty binary payload.

## Permission (Collaborator)

Represents access granted to a person or group on a note.

| Field | Type | Notes |
|---|---|---|
| `name` | string | Permission resource name, e.g. `notes/{note_id}/permissions/{permission_id}` |
| `email` | string | Collaborator's email (person or group) |
| `role` | enum | e.g. `OWNER` / `WRITER`, per Keep API |

**Validation rules** (FR-006/007/008): Add requires a valid note ID and
collaborator email; Remove requires an existing permission on that note;
List returns the full current set with no pagination assumed (Keep API
permission lists are small per note).

## Credential

Not a workflow-visible entity, but modeled since it gates every operation.

| Field | Type | Notes |
|---|---|---|
| `serviceAccountEmail` | string | From the GCP service account JSON key |
| `privateKey` | string (secret) | From the GCP service account JSON key |
| `delegatedUserEmail` | string | The Workspace user being impersonated via domain-wide delegation |

**Validation rules** (FR-001, Edge Cases): credential test MUST fail clearly
when the account is not a Workspace account or delegation is not configured,
rather than a generic auth error.
