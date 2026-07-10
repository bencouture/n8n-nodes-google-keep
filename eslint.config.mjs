import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';

export default [
	...configWithoutCloudSupport,
	{
		// These three rules assume every community node targets n8n Cloud
		// verification (MIT-only, zero runtime dependencies). This package
		// deliberately uses GPL-3.0-or-later and depends on google-auth-library
		// for its security-sensitive JWT signing (see specs/.../research.md) -
		// both informed, documented choices for a self-hosted-only node, not
		// oversights. The "overrides" field is dev-tooling-only (works around
		// an isolated-vm/Node-version mismatch in @n8n/node-cli's own
		// dependency tree) and is never shipped to consumers.
		rules: {
			'n8n-nodes-base/community-package-json-license-not-default': 'off',
			'@n8n/community-nodes/require-mit-license': 'off',
			'@n8n/community-nodes/no-runtime-dependencies': 'off',
			'@n8n/community-nodes/no-overrides-field': 'off',
		},
	},
];
