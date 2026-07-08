# Feature Specification: Google Keep n8n Node

**Feature Branch**: `001-google-keep-node`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "A plugin for n8n that provides first-class support for the Google Keep API, mirroring existing n8n plugins (e.g. Google Tasks) as closely as possible in functionality and interface, with a full test suite."

## User Scenarios & Testing *(mandatory)*

<!--
  The Google Keep API itself is small: notes (create/get/list/delete),
  note sharing (permissions), and attachment download. There is no
  update/edit operation on an existing note's content in the real API, so
  no user story below offers one — see Assumptions.
-->

### User Story 1 - Connect and retrieve existing notes (Priority: P1)

A workflow builder connects their Google Workspace credential to the node and
retrieves a single note or a list of notes, so they can pull Keep content
into a workflow (e.g. syncing notes into another system).

**Why this priority**: Nothing else in this node is reachable until
authentication and a read path work. It is the smallest slice that proves
the credential is valid and end-to-end data flows, and it delivers
standalone value (read-only export/sync of existing notes).

**Independent Test**: Configure the credential, add the node, choose
"Note" → "Get" (single note by ID) or "Get Many" (list), run the workflow,
and confirm the returned note data matches what exists in Keep.

**Acceptance Scenarios**:

1. **Given** a valid credential and an existing note ID, **When** the user
   runs "Get" with that ID, **Then** the node returns that note's title,
   text, and metadata.
2. **Given** a valid credential and multiple existing notes, **When** the
   user runs "Get Many", **Then** the node returns all matching notes,
   fetching additional pages automatically until the requested limit or the
   end of results is reached.
3. **Given** a note ID that does not exist or is not accessible, **When**
   the user runs "Get", **Then** the node returns a clear not-found error
   rather than empty/malformed data.

---

### User Story 2 - Create a new note (Priority: P2)

A workflow builder creates a new Keep note (title, body text, optional
checklist items) from data produced earlier in the workflow.

**Why this priority**: Creation is the second most common workflow use case
after reading (e.g. "log this form submission as a Keep note") and is
independently valuable once read/auth exists.

**Independent Test**: Configure the node with "Note" → "Create", supply a
title and body, run the workflow, and confirm the note appears in Keep with
the expected content.

**Acceptance Scenarios**:

1. **Given** valid title/body input, **When** the user runs "Create",
   **Then** a new note is created in Keep and the node outputs the new
   note's ID and metadata.
2. **Given** a list of checklist item strings instead of body text, **When**
   the user runs "Create", **Then** the new note is created as a checklist
   with those items.
3. **Given** required fields are missing, **When** the user runs "Create",
   **Then** the node fails with a validation error before calling the API.

---

### User Story 3 - Delete a note (Priority: P3)

A workflow builder removes a Keep note that a prior step in the workflow has
identified as no longer needed.

**Why this priority**: Completes the basic lifecycle (read/create/delete)
that most sibling n8n nodes offer, but is lower priority than create because
deletion is destructive and less frequently automated.

**Independent Test**: Configure the node with "Note" → "Delete", supply an
existing note ID, run the workflow, and confirm the note no longer appears
in Keep.

**Acceptance Scenarios**:

1. **Given** an existing note ID, **When** the user runs "Delete", **Then**
   the note is removed from Keep and the node confirms success.
2. **Given** a note ID that does not exist or was already deleted, **When**
   the user runs "Delete", **Then** the node returns a clear not-found error
   rather than a silent success, unless "Continue on Fail" is enabled.

---

### User Story 4 - Manage note sharing (Priority: P4)

A workflow builder adds or removes a collaborator (person or group) on an
existing note, or lists who currently has access, to automate sharing as
part of a larger process.

**Why this priority**: Sharing is a real Keep API capability and a
meaningful parity point with collaboration-oriented sibling nodes, but it is
an advanced/secondary action relative to the core note lifecycle.

**Independent Test**: Configure the node with "Permission" → "Add", supply a
note ID and a collaborator email, run the workflow, and confirm the
collaborator gains access in Keep.

**Acceptance Scenarios**:

1. **Given** an existing note ID and a valid collaborator identity, **When**
   the user runs "Permission" → "Add", **Then** that identity gains access
   to the note.
2. **Given** an existing note ID, **When** the user runs "Permission" →
   "List", **Then** the node returns every current collaborator on that
   note.
3. **Given** an existing note ID and a current collaborator, **When** the
   user runs "Permission" → "Remove", **Then** that collaborator no longer
   has access.

---

### User Story 5 - Download a note's attachment (Priority: P5)

A workflow builder downloads the binary content of an attachment (e.g. an
image) that is attached to a Keep note, so the workflow can process or
store it elsewhere.

**Why this priority**: Least commonly needed of the five capabilities and
depends on notes that already have attachments, making it the smallest and
most self-contained slice to add last.

**Independent Test**: Configure the node with "Attachment" → "Download",
supply a note ID and attachment reference, run the workflow, and confirm the
binary data is attached to the output item.

**Acceptance Scenarios**:

1. **Given** a note with an attachment, **When** the user runs "Attachment"
   → "Download", **Then** the node outputs the binary file data with the
   correct MIME type.
2. **Given** a note with no attachments, **When** the user runs "Attachment"
   → "Download", **Then** the node returns a clear error indicating no
   attachment was found.

---

### Edge Cases

- What happens when the connected account is a personal Gmail account
  rather than a Google Workspace account? The node MUST fail with a clear
  error explaining that the Keep API requires a Workspace account with
  domain-wide delegation configured, rather than a generic auth failure.
- What happens when the API returns a rate-limit/quota error? The node MUST
  surface it as a distinct, retryable error rather than a generic failure.
- What happens when "Get Many" is run with zero matching notes? The node
  MUST return an empty result set, not an error.
- What happens when a user attempts to edit an existing note's content?
  This is out of scope (see Assumptions) — the node offers no such
  operation, and this MUST be clear from the node's UI, not discovered only
  via an API error.
- How does the node behave when required domain-wide delegation scopes are
  missing for a given operation? It MUST surface the specific permission
  error returned by Google rather than a generic 403.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The node MUST authenticate using a Google service account
  credential with domain-wide delegation, consistent with Keep API
  requirements.
- **FR-002**: The node MUST support retrieving a single note by ID.
- **FR-003**: The node MUST support retrieving multiple notes, automatically
  paging through results up to a user-specified limit or "return all."
- **FR-004**: The node MUST support creating a note with a title, and either
  body text or a checklist of items.
- **FR-005**: The node MUST support deleting a note by ID.
- **FR-006**: The node MUST support adding a collaborator to a note.
- **FR-007**: The node MUST support listing current collaborators on a note.
- **FR-008**: The node MUST support removing a collaborator from a note.
- **FR-009**: The node MUST support downloading a note's attachment as
  binary data.
- **FR-010**: The node MUST NOT expose any operation that edits/updates the
  content of an existing note, since the underlying API has no such
  capability.
- **FR-011**: Every operation MUST report Google API errors (not-found,
  permission-denied, rate-limited, invalid-argument) as distinguishable,
  human-readable errors rather than a single generic failure message.
- **FR-012**: Every operation MUST support "Continue on Fail" behavior
  consistent with other n8n nodes, allowing a workflow to proceed past a
  single failed item.

### Key Entities

- **Note**: A Keep note. Attributes include ID, title, body text or
  checklist items, creation/update timestamps, and trashed state.
- **Attachment**: Binary media (e.g. image) attached to a note; referenced
  by the note and downloaded independently.
- **Permission (Collaborator)**: A grant of access to a note, identifying a
  person or group and their role.
- **Credential**: A Google service account configured with domain-wide
  delegation authorizing access to a Workspace user's Keep data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A workflow builder can retrieve an existing note's content
  into a workflow within one node configuration step (no custom code).
- **SC-002**: A workflow builder can create a new Keep note from workflow
  data without leaving n8n.
- **SC-003**: 100% of Google API error conditions exercised in testing
  (not-found, permission-denied, rate-limited) produce a distinguishable,
  human-readable error rather than a generic failure.
- **SC-004**: A workflow builder unfamiliar with this specific node, but
  familiar with any other n8n Google node, can identify the correct
  resource/operation to use without consulting documentation.
- **SC-005**: "Get Many" returns complete result sets for note collections
  larger than a single API page, with no manual pagination handling by the
  workflow builder.

## Assumptions

- The Google Keep API (`keep.googleapis.com`) supports only: create, get,
  list, and delete on notes; batch-create, list, and batch-delete on note
  permissions; and media download. It has no update/edit operation on note
  content — this is a real, permanent limitation of the API, not a gap in
  this node. "Mirror existing plugins as closely as possible" is read as
  applying only where the underlying API offers an equivalent capability
  (per the project constitution's Faithful API Mapping principle).
- The Keep API requires a Google Workspace account and a service account
  with domain-wide delegation; it is not usable with personal Google
  accounts or standard end-user OAuth2 consent screens. Credential setup
  reflects this.
- "Get Many" pagination follows the same n8n convention used by other
  Google nodes (a "Return All" toggle plus a "Limit" field).
- Note editing, note colors/labels/pinning, and reminders are out of scope
  for this spec because the current Keep API does not expose them; if
  Google adds them to the API, they would be a new prioritized user story,
  not a retrofit into P1-P5 above.
