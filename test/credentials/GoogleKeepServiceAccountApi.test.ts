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
