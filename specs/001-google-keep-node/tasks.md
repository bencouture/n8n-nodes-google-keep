---

description: "Task list for Google Keep n8n Node"
---

# Tasks: Google Keep n8n Node

**Input**: Design documents from `/specs/001-google-keep-node/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/keep-api-mapping.md, quickstart.md

**Tests**: Included and mandatory. Constitution Principle II (Test-First, Full
Coverage — NON-NEGOTIABLE) requires a failing test before each operation's
implementation; this is not optional for this project.

**Organization**: Tasks are grouped by user story (spec.md P1–P5) so each can
be implemented, tested, and demoed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps task to a user story (US1–US5) for traceability
- Every task includes an exact file path

## Path Conventions

Per plan.md's Project Structure: `credentials/`, `nodes/GoogleKeep/`,
`nodes/GoogleKeep/descriptions/`, `test/` — all at repository root.

---

## Phase 1: Setup

**Purpose**: Package scaffolding shared by every story

- [X] T001 Initialize the n8n community node package: `package.json` with
      `n8n.nodes` / `n8n.credentials` manifest fields, `tsconfig.json`,
      `.eslintrc.js` extending `eslint-plugin-n8n-nodes-base`, and
      `gulpfile.js` to copy icon assets into `dist/` on build, at repo root
- [X] T002 [P] Add runtime/dev dependencies: `google-auth-library`
      (runtime), `n8n-workflow`/`n8n-core` (dev/peer), `typescript`,
      `jest`, `ts-jest`, `nock`, `@types/jest` in `package.json`
- [X] T003 [P] Configure Jest with `ts-jest` in `jest.config.js`
- [X] T004 [P] Add the official Google Keep icon asset at
      `nodes/GoogleKeep/googleKeep.svg` (sourced from Google's brand/product
      icon assets per research.md — not a recreation)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth, HTTP, pagination, and error-mapping plumbing every user
story's operations call into

**⚠️ CRITICAL**: No user story task may begin until this phase is complete

- [X] T005 [P] Write failing unit test for service-account JWT
      authentication (token exchange via `google-auth-library`, Bearer
      header attached to outgoing request) in
      `test/credentials/GoogleKeepServiceAccountApi.test.ts`
- [X] T006 Implement `GoogleKeepServiceAccountApi` credential type
      (`serviceAccountEmail`, `privateKey`, `delegatedUserEmail` fields per
      data-model.md; icon reference; credential test request) in
      `credentials/GoogleKeepServiceAccountApi.credentials.ts` — makes T005
      pass
- [X] T007 [P] Write failing unit test for the base Keep API request helper
      and "Get Many" pagination loop (`pageToken`/`nextPageToken`, respects
      `limit`) in `test/nodes/GoogleKeep/genericFunctions.test.ts`
- [X] T008 Implement `googleKeepApiRequest` + pagination helper, plus
      centralized error mapping (400/401/403/404/429 → `NodeOperationError`
      / `NodeApiError` per contracts/keep-api-mapping.md) in
      `nodes/GoogleKeep/GenericFunctions.ts` — makes T007 pass (depends on
      T006 for auth)
- [X] T009 Create the `GoogleKeep.node.ts` skeleton: node description with
      `displayName`, `icon: 'file:googleKeep.svg'`, credential requirement,
      and the top-level Resource property (Note / Permission / Attachment)
      in `nodes/GoogleKeep/GoogleKeep.node.ts` (depends on T006, T008)

**Checkpoint**: Credential authenticates, base request/pagination/error
helpers exist, node loads in n8n with no operations yet — user stories can
now proceed.

---

## Phase 3: User Story 1 - Connect and retrieve existing notes (Priority: P1) 🎯 MVP

**Goal**: Get a single note by ID, and Get Many with pagination

**Independent Test**: quickstart.md step 1 — Get an existing note by ID;
Get Many across several notes and confirm all are returned

### Tests for User Story 1

- [X] T010 [P] [US1] Contract test: Note "Get" returns the note shape from
      data-model.md, and a nonexistent ID produces a not-found error, in
      `test/nodes/GoogleKeep/note.test.ts`
- [X] T011 [P] [US1] Contract test: Note "Get Many" pages through
      `nextPageToken` until `limit` or last page, and returns an empty array
      (not an error) for zero matches, in `test/nodes/GoogleKeep/note.test.ts`

### Implementation for User Story 1

- [X] T012 [US1] Add Note resource with Get / Get Many operation properties
      (`noteId`, `returnAll`, `limit`) in
      `nodes/GoogleKeep/descriptions/NoteDescription.ts` — depends on T010,
      T011 existing and failing
- [X] T013 [US1] Implement Get execute branch (`GET /v1/notes/{noteId}`) in
      `nodes/GoogleKeep/GoogleKeep.node.ts` — makes the Get half of T010 pass
- [X] T014 [US1] Implement Get Many execute branch using the T008 pagination
      helper in `nodes/GoogleKeep/GoogleKeep.node.ts` — makes T011 pass

**Checkpoint**: User Story 1 fully functional and independently testable/demoable.

---

## Phase 4: User Story 2 - Create a new note (Priority: P2)

**Goal**: Create a note with title + either body text or checklist items

**Independent Test**: quickstart.md step 2 — create a note, confirm it
appears in Keep with expected content

### Tests for User Story 2

- [X] T015 [P] [US2] Contract test: Note "Create" with text body returns
      the created note including `name`, in
      `test/nodes/GoogleKeep/note.test.ts`
- [X] T016 [P] [US2] Contract test: Note "Create" with checklist items
      creates a `body.list` note, in `test/nodes/GoogleKeep/note.test.ts`
- [X] T017 [P] [US2] Unit test: Create with neither title nor body content
      fails validation before any HTTP request is made, in
      `test/nodes/GoogleKeep/note.test.ts`

### Implementation for User Story 2

- [X] T018 [US2] Add Create operation properties (`title`, body-type
      toggle, `text` / `listItems`) in
      `nodes/GoogleKeep/descriptions/NoteDescription.ts` — depends on
      T015-T017 existing and failing
- [X] T019 [US2] Implement Create execute branch (`POST /v1/notes`) with
      pre-request validation (FR-004) in `nodes/GoogleKeep/GoogleKeep.node.ts`
      — makes T015-T017 pass

**Checkpoint**: User Stories 1–2 both independently functional.

---

## Phase 5: User Story 3 - Delete a note (Priority: P3)

**Goal**: Delete a note by ID

**Independent Test**: quickstart.md step 3 — delete a note, confirm it no
longer appears in Keep

### Tests for User Story 3

- [X] T020 [P] [US3] Contract test: Note "Delete" on an existing ID
      succeeds, in `test/nodes/GoogleKeep/note.test.ts`
- [X] T021 [P] [US3] Contract test: Note "Delete" on a nonexistent ID
      returns a not-found error, and is suppressed only when
      `continueOnFail` is enabled, in `test/nodes/GoogleKeep/note.test.ts`

### Implementation for User Story 3

- [X] T022 [US3] Add Delete operation properties (`noteId`) in
      `nodes/GoogleKeep/descriptions/NoteDescription.ts` — depends on T020,
      T021 existing and failing
- [X] T023 [US3] Implement Delete execute branch (`DELETE /v1/notes/{noteId}`)
      with `continueOnFail` support in `nodes/GoogleKeep/GoogleKeep.node.ts`
      — makes T020-T021 pass

**Checkpoint**: Full note lifecycle (US1-US3) independently functional.

---

## Phase 6: User Story 4 - Manage note sharing (Priority: P4)

**Goal**: Add, list, and remove collaborators on a note

**Independent Test**: quickstart.md step 4 — add a collaborator, confirm via
List, then Remove and confirm access is revoked

### Tests for User Story 4

- [X] T024 [P] [US4] Contract test: Permission "Add" grants access and
      returns the created permission, in
      `test/nodes/GoogleKeep/permission.test.ts`
- [X] T025 [P] [US4] Contract test: Permission "List" returns all current
      collaborators on a note, in `test/nodes/GoogleKeep/permission.test.ts`
- [X] T026 [P] [US4] Contract test: Permission "Remove" revokes an existing
      collaborator and errors on a nonexistent one, in
      `test/nodes/GoogleKeep/permission.test.ts`

### Implementation for User Story 4

- [X] T027 [P] [US4] Create Permission resource with Add / List / Remove
      operation properties (`noteId`, `email`, `role`, `permissionId`) in
      `nodes/GoogleKeep/descriptions/PermissionDescription.ts` — depends on
      T024-T026 existing and failing
- [X] T028 [US4] Implement Permission Add/List/Remove execute branches in
      `nodes/GoogleKeep/GoogleKeep.node.ts` — makes T024-T026 pass

**Checkpoint**: US1-US4 independently functional.

---

## Phase 7: User Story 5 - Download a note's attachment (Priority: P5)

**Goal**: Download an attachment's binary content from a note

**Independent Test**: quickstart.md step 5 — download an attachment from a
note that has one, confirm binary output with correct MIME type

### Tests for User Story 5

- [X] T029 [P] [US5] Contract test: Attachment "Download" on a note with an
      attachment returns binary data with the correct MIME type, in
      `test/nodes/GoogleKeep/attachment.test.ts`
- [X] T030 [P] [US5] Contract test: Attachment "Download" on a note with no
      attachments returns a clear "no attachment found" error, in
      `test/nodes/GoogleKeep/attachment.test.ts`

### Implementation for User Story 5

- [X] T031 [US5] Create Attachment resource with Download operation
      properties (`noteId`, `attachmentName`, `mimeType`) in
      `nodes/GoogleKeep/descriptions/AttachmentDescription.ts` — depends on
      T029, T030 existing and failing
- [X] T032 [US5] Implement Attachment Download execute branch
      (`GET /v1/media/{name}?alt=media`), attaching binary data to the
      output item, in `nodes/GoogleKeep/GoogleKeep.node.ts` — makes T029-T030
      pass

**Checkpoint**: All five user stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T033 [P] Run `eslint-plugin-n8n-nodes-base` across `nodes/` and
      `credentials/` and fix all violations
- [X] T034 [P] Write `README.md` covering service-account/domain-wide-
      delegation credential setup and node usage
- [ ] T035 Execute quickstart.md end-to-end against a real Keep account and
      service account, recording any deviations
- [X] T036 [P] Verify `package.json` satisfies n8n's community node
      submission checklist (manifest fields, keywords, license) per
      constitution Additional Constraints

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational; independent of
  each other, but the priority order (P1→P5) is the recommended build order
  since each successive story is smaller
- **Polish (Phase 8)**: Depends on whichever user stories are in scope for
  the release

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories
- **US2 (P2)**: No dependencies on other stories (independent of US1's Get)
- **US3 (P3)**: No dependencies on other stories
- **US4 (P4)**: No dependencies on other stories (uses its own descriptions
  file and execute branch)
- **US5 (P5)**: No dependencies on other stories

### Within Each User Story

- Contract/unit tests written and observed failing before implementation
  (Constitution Principle II)
- Operation properties (description file) before the execute branch that
  reads them
- Story complete and checkpointed before moving to the next priority

### Parallel Opportunities

- All Setup [P] tasks (T002-T004) in parallel
- T005 and T007 (foundational tests, different files) in parallel
- All tests within a single user story phase marked [P] run in parallel
  (different `describe` blocks, same or different files, no shared state)
- Once Foundational (Phase 2) is done, US1-US5 can be staffed and built in
  parallel by different contributors, though each depends on T006/T008/T009

---

## Parallel Example: User Story 1

```bash
# Launch both User Story 1 contract tests together:
Task: "Contract test: Note Get in test/nodes/GoogleKeep/note.test.ts"
Task: "Contract test: Note Get Many pagination in test/nodes/GoogleKeep/note.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (credential + auth + request/pagination/error helpers)
3. Complete Phase 3: User Story 1 (Get / Get Many)
4. **STOP and VALIDATE**: run quickstart.md step 1 against a real Keep account
5. This is a usable MVP: read-only Keep note sync into n8n workflows

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 (read) → validate → this is the MVP
3. US2 (create) → validate
4. US3 (delete) → validate — full note lifecycle now covered
5. US4 (sharing) → validate
6. US5 (attachments) → validate
7. Polish (lint, README, submission checklist, full quickstart run)

Each step adds value without requiring the next; ship after any checkpoint.
