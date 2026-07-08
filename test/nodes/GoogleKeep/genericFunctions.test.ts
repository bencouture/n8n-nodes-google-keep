import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import {
	googleKeepApiRequest,
	googleKeepApiRequestAllItems,
} from '../../../nodes/GoogleKeep/GenericFunctions';
import {
	invalidArgumentError,
	permissionDeniedError,
	rateLimitedError,
} from '../../fixtures/keepApiResponses';

function createContext(responses: unknown[]) {
	const httpRequestWithAuthentication = jest.fn();
	for (const response of responses) {
		httpRequestWithAuthentication.mockResolvedValueOnce(response);
	}
	const context = {
		helpers: { httpRequestWithAuthentication },
		getNode: () => ({ name: 'Google Keep', type: 'n8n-nodes-google-keep.googleKeep' }),
	};
	return { context, httpRequestWithAuthentication };
}

describe('googleKeepApiRequest', () => {
	it('calls the Keep API through the credential authentication helper', async () => {
		const { context, httpRequestWithAuthentication } = createContext([{ name: 'notes/123' }]);

		const result = await googleKeepApiRequest.call(context as any, 'GET', '/v1/notes/123');

		expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
			'googleKeepServiceAccountApi',
			expect.objectContaining({
				method: 'GET',
				url: 'https://keep.googleapis.com/v1/notes/123',
			}),
		);
		expect(result).toEqual({ name: 'notes/123' });
	});
});

describe('googleKeepApiRequestAllItems', () => {
	it('pages through nextPageToken until the last page when returnAll is true', async () => {
		const { context, httpRequestWithAuthentication } = createContext([
			{ notes: [{ name: 'a' }, { name: 'b' }], nextPageToken: 'page2' },
			{ notes: [{ name: 'c' }] },
		]);

		const result = await googleKeepApiRequestAllItems.call(
			context as any,
			'notes',
			'GET',
			'/v1/notes',
			{},
			{},
			true,
		);

		expect(result).toEqual([{ name: 'a' }, { name: 'b' }, { name: 'c' }]);
		expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
	});

	it('stops once limit is reached without fetching further pages', async () => {
		const { context, httpRequestWithAuthentication } = createContext([
			{ notes: [{ name: 'a' }, { name: 'b' }, { name: 'c' }], nextPageToken: 'page2' },
		]);

		const result = await googleKeepApiRequestAllItems.call(
			context as any,
			'notes',
			'GET',
			'/v1/notes',
			{},
			{},
			false,
			2,
		);

		expect(result).toEqual([{ name: 'a' }, { name: 'b' }]);
		expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
	});

	it('returns an empty array (not an error) when there are zero matches', async () => {
		const { context } = createContext([{ notes: [] }]);

		const result = await googleKeepApiRequestAllItems.call(
			context as any,
			'notes',
			'GET',
			'/v1/notes',
			{},
			{},
			true,
		);

		expect(result).toEqual([]);
	});

	it('treats a response with the items key entirely absent as zero results', async () => {
		const { context } = createContext([{}]);

		const result = await googleKeepApiRequestAllItems.call(
			context as any,
			'notes',
			'GET',
			'/v1/notes',
			{},
			{},
			true,
		);

		expect(result).toEqual([]);
	});
});

describe('googleKeepApiRequest error mapping', () => {
	function createRejectingContext(error: unknown) {
		const httpRequestWithAuthentication = jest.fn().mockRejectedValueOnce(error);
		const context = {
			helpers: { httpRequestWithAuthentication },
			getNode: () => ({ name: 'Google Keep', type: 'n8n-nodes-google-keep.googleKeep' }),
		};
		return context;
	}

	it('maps a 400 invalid-argument error to NodeOperationError (workflow input problem)', async () => {
		const context = createRejectingContext(invalidArgumentError);

		await expect(
			googleKeepApiRequest.call(context as any, 'POST', '/v1/notes'),
		).rejects.toBeInstanceOf(NodeOperationError);
	});

	it('maps a 403 permission-denied error (response.status shape) to NodeApiError, preserving Google\'s specific message', async () => {
		const context = createRejectingContext(permissionDeniedError);

		await expect(
			googleKeepApiRequest.call(context as any, 'GET', '/v1/notes/abc123'),
		).rejects.toMatchObject({
			constructor: NodeApiError,
			httpCode: '403',
			description: 'The caller does not have permission',
		});
	});

	it('maps a 429 rate-limited error (httpCode shape) to a distinct, retryable NodeApiError', async () => {
		const context = createRejectingContext(rateLimitedError);

		await expect(
			googleKeepApiRequest.call(context as any, 'GET', '/v1/notes'),
		).rejects.toMatchObject({
			constructor: NodeApiError,
			httpCode: '429',
		});
	});

	it('resolves the status code from error.cause.response.status when no other shape matches', async () => {
		const context = createRejectingContext({
			message: 'wrapped failure',
			cause: { response: { status: 503 } },
		});

		await expect(
			googleKeepApiRequest.call(context as any, 'GET', '/v1/notes'),
		).rejects.toMatchObject({
			constructor: NodeApiError,
			httpCode: '503',
		});
	});

	it('falls back to a NodeApiError with no httpCode for a network-level failure with no status at all', async () => {
		const context = createRejectingContext({ message: 'ECONNRESET' });

		await expect(
			googleKeepApiRequest.call(context as any, 'GET', '/v1/notes'),
		).rejects.toMatchObject({
			constructor: NodeApiError,
			httpCode: null,
		});
	});
});
