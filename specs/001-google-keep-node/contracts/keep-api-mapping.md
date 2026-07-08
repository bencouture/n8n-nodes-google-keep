# Contract: Node Operations → Google Keep REST API

This node has no public API of its own; its "contract" is the mapping
between n8n resource/operation parameters and the real Keep REST endpoints.
This is the surface `tasks.md` writes contract tests against (mocked via
`nock`, per research.md).

## Resource: Note

| Operation | n8n params | REST call | Success shape | Error cases |
|---|---|---|---|---|
| Get | `noteId` | `GET /v1/notes/{noteId}` | Note object (data-model.md) | 404 not-found → NodeApiError |
| Get Many | `returnAll`, `limit`, `pageSize` | `GET /v1/notes` (loop on `pageToken`) | array of Note | empty list on zero matches (not an error) |
| Create | `title`, `bodyType` (text/checklist), `text` or `listItems[]` | `POST /v1/notes` | created Note object incl. `name` | missing title AND body → validation error before request |
| Delete | `noteId` | `DELETE /v1/notes/{noteId}` | empty success | 404 not-found → NodeApiError (unless `continueOnFail`) |

## Resource: Permission

| Operation | n8n params | REST call | Success shape | Error cases |
|---|---|---|---|---|
| Add | `noteId`, `email`, `role` | `POST /v1/notes/{noteId}/permissions:batchCreate` | created Permission(s) | invalid email / note not found → NodeApiError |
| List | `noteId` | `GET /v1/notes/{noteId}` (permissions are returned inline on the note) or dedicated list per API version | array of Permission | note not found → NodeApiError |
| Remove | `noteId`, `permissionId` | `POST /v1/notes/{noteId}/permissions:batchDelete` | empty success | permission not found → NodeApiError |

## Resource: Attachment

| Operation | n8n params | REST call | Success shape | Error cases |
|---|---|---|---|---|
| Download | `noteId`, `attachmentName`, `mimeType` | `GET /v1/media/{attachmentName}?alt=media&mimeType=...` | binary data on output item | note/attachment not found → NodeApiError "no attachment found" |

## Error mapping (applies to all operations, Principle V)

| Keep API HTTP status | Node error |
|---|---|
| 400 | `NodeOperationError` — invalid argument, message passed through |
| 401 / 403 | `NodeApiError` — permission/delegation error, Google's message passed through verbatim |
| 404 | `NodeApiError` — not-found, distinguishable from other 4xx |
| 429 | `NodeApiError` — rate-limited, marked so n8n's retry/backoff applies |
