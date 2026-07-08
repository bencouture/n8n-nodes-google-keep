import { JWT } from 'google-auth-library';
import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

const KEEP_SCOPE = 'https://www.googleapis.com/auth/keep';

// ponytail: one JWT client per service account, so google-auth-library's own
// token cache/refresh (the reason we depend on it) actually gets reused
// across requests in the same process instead of re-authenticating every call.
const jwtClientCache = new Map<string, JWT>();

function getJwtClient(credentials: ICredentialDataDecryptedObject): JWT {
	const serviceAccountEmail = credentials.serviceAccountEmail as string;
	const delegatedUserEmail = credentials.delegatedUserEmail as string;
	const cacheKey = `${serviceAccountEmail}:${delegatedUserEmail}`;

	let client = jwtClientCache.get(cacheKey);
	if (!client) {
		client = new JWT({
			email: serviceAccountEmail,
			key: (credentials.privateKey as string).replace(/\\n/g, '\n'),
			scopes: [KEEP_SCOPE],
			subject: delegatedUserEmail,
		});
		jwtClientCache.set(cacheKey, client);
	}
	return client;
}

export class GoogleKeepServiceAccountApi implements ICredentialType {
	name = 'googleKeepServiceAccountApi';

	displayName = 'Google Keep Service Account API';

	documentationUrl = 'https://developers.google.com/workspace/keep/api/guides/service-accounts';

	icon = 'file:googleKeep.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Service Account Email',
			name: 'serviceAccountEmail',
			type: 'string',
			default: '',
			placeholder: 'my-service-account@my-project.iam.gserviceaccount.com',
			required: true,
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: { password: true, rows: 4 },
			default: '',
			required: true,
		},
		{
			displayName: 'Delegated User Email',
			name: 'delegatedUserEmail',
			type: 'string',
			default: '',
			placeholder: 'user@example.com',
			description: 'The Workspace user to impersonate via domain-wide delegation',
			required: true,
		},
	];

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const client = getJwtClient(credentials);

		let accessToken: string;
		try {
			const tokenResponse = await client.getAccessToken();
			if (!tokenResponse.token) {
				throw new Error('Google did not return an access token');
			}
			accessToken = tokenResponse.token;
		} catch (error) {
			throw new Error(
				`Google Keep authentication failed: ${(error as Error).message}. Confirm the ` +
					'service account belongs to a Google Workspace domain with domain-wide ' +
					'delegation configured for the Keep API scope.',
			);
		}

		requestOptions.headers = {
			...requestOptions.headers,
			Authorization: `Bearer ${accessToken}`,
		};
		return requestOptions;
	}

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://keep.googleapis.com',
			url: '/v1/notes',
			qs: { pageSize: 1 },
		},
	};
}
