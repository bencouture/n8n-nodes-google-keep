# Implementation Plan: Google Keep n8n Node

**Branch**: `001-google-keep-node` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-google-keep-node/spec.md`

## Summary

Ship an n8n community node package exposing the real Google Keep API
(`keep.googleapis.com`) as three resources — Note, Permission, Attachment —
across five prioritized operations (get/list, create, delete, share, download
attachment). No update/edit operation exists because the underlying API has
none. The node authenticates via a Workspace service account with
domain-wide delegation, follows the same resource/operation UI pattern as
n8n's other Google nodes, and ships the official Google Keep icon so it's
visually identifiable alongside sibling Google nodes in the node picker.

## Technical Context

**Language/Version**: TypeScript 5.x targeting Node.js 20 (current n8n
community node baseline)

**Primary Dependencies**: `n8n-workflow` / `n8n-core` (dev/peer, for node
typing); `google-auth-library` (official, minimal — handles service-account
JWT signing, token exchange, and expiry/refresh caching, which is a
security-sensitive path not worth hand-rolling); no `googleapis` generated
client — REST calls go through n8n's built-in `httpRequestWithAuthentication`
helper since the Keep API surface is ~8 plain REST endpoints

**Storage**: N/A — stateless request/response node, no local persistence

**Testing**: Jest + ts-jest, matching the n8n community node starter
convention; `nock` for mocking Keep API HTTP responses in unit/integration
tests

**Target Platform**: n8n runtime (self-hosted or Cloud), Node.js 20+

**Project Type**: single project — an n8n community node package (not a
web/mobile split)

**Performance Goals**: node overhead negligible beyond Google API latency;
"Get Many" pagination MUST respect the user's limit rather than unboundedly
fetching every page

**Constraints**: must pass `eslint-plugin-n8n-nodes-base` lint; must satisfy
n8n's community node submission checklist; Keep API requires a Workspace
service account + domain-wide delegation, not the 3-legged consumer OAuth2
flow other n8n Google nodes use (see Constitution Check)

**Scale/Scope**: 3 resources (Note, Permission, Attachment) across 5
prioritized operations total; one node file, one credential type

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — no changes.*

| Principle | Gate | Status |
|---|---|---|
| I. n8n Interface Parity | Resource/operation dropdown pattern, node icon, error surface match sibling Google nodes | PASS |
| II. Test-First, Full Coverage | tasks.md (next phase) will sequence a failing test before each operation's implementation | PASS (enforced at task level) |
| III. Faithful API Mapping | Only the 4 note ops + 3 permission ops + 1 media op that the real API supports are exposed; no update op | PASS |
| IV. Minimal Surface (YAGNI) | No plugin framework; direct resource/operation switch; `googleapis` client rejected as unneeded surface | PASS |
| V. Consistent Error Handling | All operations route Google API errors through `NodeApiError`/`NodeOperationError`; `continueOnFail` supported everywhere | PASS |
| VI. Semantic Versioning | Package uses semver; node starts at `typeVersion: 1` | PASS |

**Resolved tension** (was flagged here, fixed in constitution v1.0.1): the
constitution's "Additional Constraints" section previously said credentials
use "the OAuth2 pattern already used by other n8n Google nodes," which
didn't hold for Keep — there's no consumer 3-legged OAuth2 option, only
Workspace service-account + domain-wide delegation. The constitution now
states the service-account requirement directly; no remaining conflict.

## Project Structure

### Documentation (this feature)

```text
specs/001-google-keep-node/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
credentials/
└── GoogleKeepServiceAccountApi.credentials.ts

nodes/
└── GoogleKeep/
    ├── GoogleKeep.node.ts
    ├── GenericFunctions.ts          # shared REST call + pagination helpers
    ├── googleKeep.svg               # official Google Keep icon (Principle I + user request)
    └── descriptions/
        ├── NoteDescription.ts       # P1 get/get-many, P2 create, P3 delete
        ├── PermissionDescription.ts # P4 add/list/remove collaborator
        └── AttachmentDescription.ts # P5 download

test/
├── credentials/
│   └── GoogleKeepServiceAccountApi.test.ts
├── nodes/
│   └── GoogleKeep/
│       ├── note.test.ts
│       ├── permission.test.ts
│       └── attachment.test.ts
└── fixtures/
    └── keepApiResponses.ts

package.json        # n8n community node manifest (n8n.nodes / n8n.credentials fields)
tsconfig.json
.eslintrc.js         # extends eslint-plugin-n8n-nodes-base
gulpfile.js          # copies icon SVGs into dist/ on build (n8n starter convention)
```

**Structure Decision**: Standard n8n community node package layout
(`credentials/`, `nodes/<NodeName>/`, `test/`) rather than a generic
`src/models|services|cli` tree — this is the layout every existing n8n
node package uses, satisfying Principle I and Principle IV (reuse the
platform's own convention, no invented structure).

## Complexity Tracking

No unjustified violations. The one documented tension (service-account vs.
OAuth2 wording in the constitution) is a spec-mandated deviation already
justified above under Constitution Check, not a complexity addition.
