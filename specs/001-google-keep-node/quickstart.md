# Quickstart: Validating the Google Keep n8n Node

## Prerequisites

- A Google Workspace domain where you (or an admin) can create a service
  account and grant it domain-wide delegation with Keep API scopes.
- A GCP project with the Keep API enabled, and a downloaded service account
  JSON key.
- A local n8n instance (`npx n8n`) with this package linked as a custom node
  (`npm link` into n8n's custom extensions directory, per n8n's community
  node development docs).

## Setup

1. `npm install && npm run build` in this repo.
2. Link the built package into your local n8n instance's custom nodes dir.
3. Start n8n; confirm "Google Keep" appears in the node picker with the Keep
   icon (see data-model.md Credential entity, contracts/keep-api-mapping.md).
4. In n8n, create a "Google Keep Service Account API" credential using the
   service account email, private key, and the Workspace user email to
   impersonate. Save and run the credential test — it should pass.

## Validate each priority

Run these in order; each corresponds to a user story in spec.md and should
be independently checkable.

1. **P1 — Read**: Add a Google Keep node, Resource = Note, Operation = Get,
   supply an existing note's ID. Execute. Confirm the output matches
   data-model.md's Note shape. Repeat with Get Many against an account with
   several notes; confirm all notes are returned.
2. **P2 — Create**: Operation = Create, supply a title and body text.
   Execute. Confirm the note appears in the Keep web/mobile app.
3. **P3 — Delete**: Operation = Delete, supply the note ID created above.
   Execute. Confirm the note no longer appears in Keep.
4. **P4 — Sharing**: Resource = Permission, Operation = Add, supply a note
   ID and a collaborator email. Execute, then confirm in Keep that the
   collaborator has access. Run Operation = List to confirm it's reflected,
   then Remove to revoke it.
5. **P5 — Attachment**: Resource = Attachment, Operation = Download, on a
   note that has an image attached. Execute. Confirm the output item has
   binary data with the correct MIME type.

## Expected failure cases (spot-check, not exhaustive)

- Get with a nonexistent note ID → clear not-found error, not a crash.
- Credential created against a personal Gmail account → clear error naming
  the Workspace/domain-wide-delegation requirement (see spec Edge Cases).
- Attachment download on a note with no attachments → clear "no attachment
  found" error.

Full pass/fail detail per operation belongs in the test suite
(`test/nodes/GoogleKeep/*.test.ts`), generated in the next phase
(`/speckit-tasks`). This guide is for a human to confirm the feature works
against a real Keep account before/alongside that suite.
