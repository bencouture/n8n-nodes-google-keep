<!--
Sync Impact Report
Version change: 1.0.0 → 1.0.1
Modified principles: n/a (no principle renamed/redefined)
Modified sections:
  - Additional Constraints: "Credentials" bullet corrected — the Keep API
    has no consumer 3-legged OAuth2 flow to mirror, so credentials use a
    Workspace service account with domain-wide delegation instead. Raised
    during /speckit-plan for feature 001-google-keep-node (plan.md's
    Constitution Check flagged the prior wording as factually wrong for
    this API); resolved here per Principle III (Faithful API Mapping).
Added sections: none
Removed sections: none
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no change needed (generic gate)
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
  - .specify/templates/checklist-template.md ✅ no change needed
  - specs/001-google-keep-node/plan.md ⚠ pending — its Constitution Check
    "Flagged tension" note can be marked resolved now that the constitution
    matches reality; not edited by this command
Follow-up TODOs: none
-->

# n8n-nodes-google-keep Constitution

## Core Principles

### I. n8n Interface Parity

Every resource/operation this node exposes MUST follow the same structural
conventions as existing n8n Google service nodes (e.g. Google Tasks, Google
Drive, Google Calendar): the resource/operation dropdown pattern, credential
type naming and OAuth2 flow, parameter naming, node icon/description
conventions, and error surface. Any deviation from an established n8n
convention MUST be justified in the plan's Complexity Tracking section.

Rationale: a user familiar with any existing n8n Google node should be able
to use this one without relearning conventions; consistency is also a
prerequisite for passing n8n's community node review.

### II. Test-First, Full Coverage (NON-NEGOTIABLE)

Tests for a resource/operation MUST be written before its implementation and
MUST fail before that implementation exists. Unit tests cover parameter
mapping and transformation logic; integration tests cover each operation
against a mocked Google Keep API surface. No PR merges with an
operation that lacks tests or that regresses coverage.

Rationale: "full test suite" is a stated project requirement, and manual
verification cannot realistically cover every credential/resource/operation
combination a workflow author might hit.

### III. Faithful API Mapping

Operations MUST map to real, documented Google Keep API capabilities only.
No speculative parameters, fields, or operations may be added because "the
Google Tasks node has one." Where parity (Principle I) and the actual API
surface conflict, the real API wins, and the gap MUST be documented rather
than papered over with invented behavior.

Rationale: parity with sibling plugins is a UX target, not license to
fabricate capabilities the underlying API doesn't provide.

### IV. Minimal Surface (YAGNI)

Implement only the resources/operations the Google Keep API exposes today.
No generic plugin framework, no configuration for hypothetical future APIs,
no abstraction layer beyond what n8n's node/credential pattern already
requires.

Rationale: this is a single-purpose integration node; n8n's base node
architecture already provides the extension points needed.

### V. Consistent Error Handling & Observability

All API failures MUST surface through n8n's standard NodeApiError /
NodeOperationError, preserving the underlying HTTP status and Google error
message. Every operation MUST support `continueOnFail` per n8n convention.
Silent failures or swallowed errors are prohibited.

Rationale: matches how other n8n nodes behave (Principle I) and keeps
workflow failures debuggable in production.

### VI. Semantic Versioning & Backwards Compatibility

The package follows semantic versioning. Breaking parameter or interface
changes MUST use n8n's node type versioning system rather than silently
altering existing behavior. An upgrade MUST NOT break a workflow already
built on this node.

Rationale: community nodes run inside other people's live workflows;
unversioned breaking changes break production automations.

## Additional Constraints

- Stack: Node.js + TypeScript, matching n8n community node tooling.
- Lint: `eslint-plugin-n8n-nodes-base` rules apply and MUST pass in CI.
- Credentials: implemented as a standalone credentials type. The Keep API
  has no consumer 3-legged OAuth2 flow, so this credential authenticates via
  a Google Workspace service account with domain-wide delegation, following
  the same service-account credential pattern other n8n Google nodes use
  where OAuth2 isn't an option (e.g. BigQuery, Sheets service-account mode).
- The package MUST satisfy n8n's community node submission checklist before
  publishing.

## Development Workflow

- Tests are written and observed failing before implementation (Principle
  II); this applies per operation, not just per feature.
- CI runs lint and the full test suite on every PR; failures block merge.
- Any divergence from n8n conventions (Principle I) is called out in the
  plan's Complexity Tracking table with the rejected simpler alternative.

## Governance

This constitution supersedes ad hoc practice for this repository. Amendments
require a recorded rationale and a version bump using the same semantic
versioning rules applied to the package (MAJOR: incompatible principle
removal/redefinition; MINOR: new/expanded principle; PATCH: wording/
clarification only). All PRs and reviews MUST verify compliance with these
principles; reviewers should reject PRs that add speculative features, skip
tests, or diverge from n8n conventions without documented justification.

**Version**: 1.0.1 | **Ratified**: 2026-07-08 | **Last Amended**: 2026-07-08
