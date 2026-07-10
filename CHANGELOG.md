# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Replaced the monochrome node icon with Google's official colored "Google
  Keep icon (2015-2020)" (yellow rounded square, bulb outline).
- Expanded the README credential setup section: the Service Account vs.
  OAuth 2.0 Client ID distinction, exact GCP/Workspace Admin console steps,
  the required scope, and a troubleshooting section for the PEM-parsing and
  `unauthorized_client` errors.
- Added a prominent callout that the Keep API only works with a paid Google
  Workspace account, never a personal/consumer Google account.
- Marked the credential-type comparison table with a checkmark/X on the
  working vs. non-working column.

## [0.1.1] - 2026-07-08

### Changed

- Relicensed from MIT to GPL-3.0-or-later.

### Fixed

- Private key parsing when line breaks are stripped on paste (n8n's masked
  Private Key field is a native `<input type="password">`, which can't hold
  multi-line text). The credential now rebuilds standards-compliant PEM from
  whatever survives - escaped `\n`, real `\n`, or no separators at all -
  instead of requiring one specific paste format. Previously surfaced as
  `error:1E08010C:DECODER routines::unsupported`.

## [0.1.0] - 2026-07-08

### Added

- Initial release of the Google Keep n8n community node.
- **Note** resource: Get, Get Many (with pagination), Create (text or
  checklist body), Delete.
- **Permission** resource: Add, List, Remove note collaborators.
- **Attachment** resource: Download a note's attachment as binary data.
- `Google Keep Service Account API` credential: service-account JWT
  authentication with Google Workspace domain-wide delegation.
- Full Jest test suite covering every operation, error-mapping path
  (400/401/403/404/429), and documented edge case.

[Unreleased]: https://github.com/bencouture/n8n-nodes-google-keep/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/bencouture/n8n-nodes-google-keep/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/bencouture/n8n-nodes-google-keep/releases/tag/v0.1.0
