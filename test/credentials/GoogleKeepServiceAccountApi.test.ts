import type { ICredentialDataDecryptedObject, IHttpRequestOptions } from 'n8n-workflow';

const getAccessToken = jest.fn();
const jwtConstructor = jest.fn().mockImplementation(() => ({ getAccessToken }));

jest.mock('google-auth-library', () => ({
	JWT: jwtConstructor,
}));

import { GoogleKeepServiceAccountApi } from '../../credentials/GoogleKeepServiceAccountApi.credentials';

describe('GoogleKeepServiceAccountApi', () => {
	const credentials: ICredentialDataDecryptedObject = {
		serviceAccountEmail: 'sa@my-project.iam.gserviceaccount.com',
		privateKey: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n',
		delegatedUserEmail: 'user@example.com',
	};

	beforeEach(() => {
		getAccessToken.mockReset();
	});

	it('exchanges the service-account JWT for an access token and attaches it as a Bearer header', async () => {
		getAccessToken.mockResolvedValue({ token: 'exchanged-access-token' });

		const credentialType = new GoogleKeepServiceAccountApi();
		const requestOptions: IHttpRequestOptions = { url: 'https://keep.googleapis.com/v1/notes' };

		const result = await credentialType.authenticate!(
			credentials,
			requestOptions,
		) as IHttpRequestOptions;

		expect(getAccessToken).toHaveBeenCalledTimes(1);
		expect(result.headers?.Authorization).toBe('Bearer exchanged-access-token');
	});

	it('surfaces a clear Workspace/domain-wide-delegation error when the token exchange fails, not a generic auth failure', async () => {
		getAccessToken.mockRejectedValue(new Error('unauthorized_client'));

		const credentialType = new GoogleKeepServiceAccountApi();
		const requestOptions: IHttpRequestOptions = { url: 'https://keep.googleapis.com/v1/notes' };

		await expect(
			credentialType.authenticate!(credentials, requestOptions),
		).rejects.toThrow(/unauthorized_client.*Workspace domain.*domain-wide delegation/s);
	});

	it('fails clearly when the exchange succeeds but Google returns no token', async () => {
		getAccessToken.mockResolvedValue({ token: undefined });

		const credentialType = new GoogleKeepServiceAccountApi();
		const requestOptions: IHttpRequestOptions = { url: 'https://keep.googleapis.com/v1/notes' };

		await expect(
			credentialType.authenticate!(credentials, requestOptions),
		).rejects.toThrow(/did not return an access token/);
	});

	it('reconstructs a valid multi-line PEM when newlines were stripped (e.g. pasted into a masked single-line field)', async () => {
		getAccessToken.mockResolvedValue({ token: 'token-b' });
		// A base64 body long enough to span multiple 64-char PEM lines once rewrapped.
		const base64Body = 'a'.repeat(130);
		const flattenedCredentials: ICredentialDataDecryptedObject = {
			...credentials,
			serviceAccountEmail: 'flattened-sa@my-project.iam.gserviceaccount.com',
			privateKey: `-----BEGIN PRIVATE KEY-----${base64Body}-----END PRIVATE KEY-----`,
		};

		const credentialType = new GoogleKeepServiceAccountApi();
		await credentialType.authenticate!(flattenedCredentials, {
			url: 'https://keep.googleapis.com/v1/notes',
		});

		const passedKey = jwtConstructor.mock.calls[jwtConstructor.mock.calls.length - 1][0].key as string;
		expect(passedKey).toBe(
			[
				'-----BEGIN PRIVATE KEY-----',
				base64Body.slice(0, 64),
				base64Body.slice(64, 128),
				base64Body.slice(128),
				'-----END PRIVATE KEY-----',
			].join('\n'),
		);
	});

	it('reuses one JWT client per service account instead of re-authenticating every request', async () => {
		getAccessToken.mockResolvedValue({ token: 'token-a' });
		const uniqueCredentials: ICredentialDataDecryptedObject = {
			...credentials,
			serviceAccountEmail: 'unique-sa@my-project.iam.gserviceaccount.com',
		};
		const callsBefore = jwtConstructor.mock.calls.length;

		const credentialType = new GoogleKeepServiceAccountApi();
		await credentialType.authenticate!(uniqueCredentials, { url: 'https://keep.googleapis.com/a' });
		await credentialType.authenticate!(uniqueCredentials, { url: 'https://keep.googleapis.com/b' });

		expect(jwtConstructor.mock.calls.length - callsBefore).toBe(1);
		expect(getAccessToken).toHaveBeenCalledTimes(2);
	});
});
