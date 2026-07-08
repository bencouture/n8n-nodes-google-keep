# Phase 0 Research: Google Keep n8n Node

## Auth: service-account JWT signing

**Decision**: Use `google-auth-library` (Google's official, minimal client)
to sign the service-account JWT, perform the domain-wide-delegation token
exchange, and cache/refresh the resulting access token. Use n8n's built-in
`httpRequestWithAuthentication` helper for the actual Keep REST calls once a
token is attached.

**Rationale**: Token signing/exchange/refresh is a security-sensitive path
with real edge cases (clock skew, expiry, retry-on-401). `google-auth-library`
is small, Google-maintained, and exists specifically for this; hand-rolling
JWT signing with Node's `crypto` would be less code but reintroduces exactly
the kind of auth bug class the library exists to prevent.

**Alternatives considered**:
- `googleapis` (full generated client) — rejected: pulls in generated
  bindings for dozens of APIs this node never calls, for a REST surface of
  ~8 endpoints. `google-auth-library` alone covers the auth need without it.
- Hand-rolled JWT via Node `crypto` — rejected: doable, but auth/expiry/retry
  edge cases are exactly where a hand-rolled implementation quietly breaks;
  not worth it to avoid one small, purpose-built dependency.

## HTTP calls: raw REST vs. generated client

**Decision**: Call `keep.googleapis.com` REST endpoints directly via n8n's
`httpRequestWithAuthentication` helper (JSON in/out), with a small
`GenericFunctions.ts` wrapper for pagination.

**Rationale**: The Keep API is a plain REST/JSON API with 8 methods total.
n8n already provides an authenticated HTTP helper; adding a client library
on top would just be indirection over what one helper function already does.

**Alternatives considered**: `googleapis` client — same rejection as above.

## Icon: Google Keep logo

**Decision**: Ship the official Google Keep product icon as a static SVG at
`nodes/GoogleKeep/googleKeep.svg`, referenced via `icon: 'file:googleKeep.svg'`
on both the node and credential descriptions.

**Rationale**: Matches Principle I (n8n Interface Parity) and the user's
explicit request. Every existing n8n Google node (Gmail, Drive, Calendar,
Tasks, Sheets) ships the literal Google product icon for the service it
integrates — this is the established convention, not a special case.

**Alternatives considered**: generic note/checklist icon — rejected, breaks
visual parity with sibling Google nodes and doesn't satisfy the request.

**Follow-up**: source the SVG from Google's official brand/product icon
assets (not a screenshot or third-party recreation) before publishing.

## Testing framework

**Decision**: Jest + `ts-jest`, with `nock` for HTTP mocking.

**Rationale**: Standard tooling for n8n community nodes (matches
`n8n-nodes-starter` and n8n-nodes-base itself); Constitution Principle I
extends to tooling conventions contributors will already expect.

**Alternatives considered**: Vitest — rejected, not the convention n8n
community node contributors expect, no compelling advantage here.

## Pagination ("Get Many")

**Decision**: Standard n8n `returnAll` boolean + `limit` number fields on
the Note "Get Many" operation, looping over the Keep API's `pageToken` /
`nextPageToken` until the limit or last page is reached.

**Rationale**: Matches FR-003/SC-005 and is the exact UX pattern other n8n
Google nodes already use for list operations (Principle I).

**Alternatives considered**: always-fetch-all with no limit — rejected,
risks unbounded memory/time use on large note collections.
