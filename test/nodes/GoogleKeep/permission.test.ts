import { GoogleKeep } from '../../../nodes/GoogleKeep/GoogleKeep.node';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';
import { notFoundError, samplePermission, sampleTextNote } from '../../fixtures/keepApiResponses';

describe('GoogleKeep node - Permission resource', () => {
	describe('Add', () => {
		it('grants access and returns the created permission', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'permission',
					operation: 'add',
					noteId: 'abc123',
					email: 'collaborator@example.com',
					role: 'WRITER',
				},
			});
			httpRequestWithAuthentication.mockResolvedValueOnce({ permissions: [samplePermission] });

			const result = await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://keep.googleapis.com/v1/notes/abc123/permissions:batchCreate',
					body: { permissions: [{ role: 'WRITER', email: 'collaborator@example.com' }] },
				}),
			);
			expect(result[0][0].json).toEqual(samplePermission);
		});

		it('errors on an invalid note ID', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'permission',
					operation: 'add',
					noteId: 'missing',
					email: 'collaborator@example.com',
					role: 'WRITER',
				},
			});
			httpRequestWithAuthentication.mockRejectedValueOnce(notFoundError);

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/could not be found/,
			);
		});

		it('returns an empty array when the API response has no "permissions" key at all', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'permission',
					operation: 'add',
					noteId: 'abc123',
					email: 'collaborator@example.com',
					role: 'WRITER',
				},
			});
			httpRequestWithAuthentication.mockResolvedValueOnce({});

			const result = await new GoogleKeep().execute.call(context);

			expect(result[0]).toHaveLength(0);
		});
	});

	describe('List', () => {
		it('returns all current collaborators on a note', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'permission', operation: 'list', noteId: 'abc123' },
			});
			httpRequestWithAuthentication.mockResolvedValueOnce({
				...sampleTextNote,
				permissions: [samplePermission],
			});

			const result = await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					method: 'GET',
					url: 'https://keep.googleapis.com/v1/notes/abc123',
				}),
			);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(samplePermission);
		});

		it('errors when the note is not found', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'permission', operation: 'list', noteId: 'missing' },
			});
			httpRequestWithAuthentication.mockRejectedValueOnce(notFoundError);

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/could not be found/,
			);
		});

		it('returns an empty array when the note has no "permissions" key at all (no collaborators)', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'permission', operation: 'list', noteId: 'abc123' },
			});
			httpRequestWithAuthentication.mockResolvedValueOnce(sampleTextNote);

			const result = await new GoogleKeep().execute.call(context);

			expect(result[0]).toHaveLength(0);
		});
	});

	describe('Remove', () => {
		it('revokes an existing collaborator', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'permission',
					operation: 'remove',
					noteId: 'abc123',
					permissionId: 'perm1',
				},
			});
			httpRequestWithAuthentication.mockResolvedValueOnce({});

			const result = await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://keep.googleapis.com/v1/notes/abc123/permissions:batchDelete',
					body: { names: ['notes/abc123/permissions/perm1'] },
				}),
			);
			expect(result[0][0].json).toEqual({ success: true });
		});

		it('errors on a nonexistent permission', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'permission',
					operation: 'remove',
					noteId: 'abc123',
					permissionId: 'missing',
				},
			});
			httpRequestWithAuthentication.mockRejectedValueOnce(notFoundError);

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/could not be found/,
			);
		});
	});

	describe('Unsupported operation', () => {
		it('rejects with a NodeOperationError instead of calling the API', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'permission', operation: 'notARealOperation', noteId: 'abc123' },
			});

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/not supported for resource "permission"/,
			);
			expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
		});
	});
});
