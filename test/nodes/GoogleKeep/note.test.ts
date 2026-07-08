import { GoogleKeep } from '../../../nodes/GoogleKeep/GoogleKeep.node';
import { noteOperations } from '../../../nodes/GoogleKeep/descriptions/NoteDescription';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';
import {
	notFoundError,
	sampleChecklistNote,
	sampleTextNote,
} from '../../fixtures/keepApiResponses';

describe('GoogleKeep node - Note resource', () => {
	describe('Get', () => {
		it('returns the note shape for an existing note ID', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'get', noteId: 'abc123' },
			});
			httpRequestWithAuthentication.mockResolvedValueOnce(sampleTextNote);

			const result = await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					method: 'GET',
					url: 'https://keep.googleapis.com/v1/notes/abc123',
				}),
			);
			expect(result[0][0].json).toEqual(sampleTextNote);
		});

		it('produces a not-found error for a nonexistent note ID', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'get', noteId: 'missing' },
			});
			httpRequestWithAuthentication.mockRejectedValueOnce(notFoundError);

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/could not be found/,
			);
		});
	});

	describe('Get Many', () => {
		it('pages through nextPageToken until limit or last page', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'getAll', returnAll: true },
			});
			httpRequestWithAuthentication
				.mockResolvedValueOnce({ notes: [sampleTextNote], nextPageToken: 'page2' })
				.mockResolvedValueOnce({ notes: [{ ...sampleTextNote, name: 'notes/second' }] });

			const result = await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
			expect(result[0]).toHaveLength(2);
		});

		it('returns an empty array (not an error) for zero matches', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'getAll', returnAll: true },
			});
			httpRequestWithAuthentication.mockResolvedValueOnce({ notes: [] });

			const result = await new GoogleKeep().execute.call(context);

			expect(result[0]).toHaveLength(0);
		});

		it('stops at the configured limit when Return All is off', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'getAll', returnAll: false, limit: 1 },
			});
			httpRequestWithAuthentication.mockResolvedValueOnce({
				notes: [sampleTextNote, { ...sampleTextNote, name: 'notes/second' }],
				nextPageToken: 'page2',
			});

			const result = await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
			expect(result[0]).toHaveLength(1);
		});
	});

	describe('Create', () => {
		it('creates a note with a text body and returns it including its name', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'note',
					operation: 'create',
					title: 'Shopping list',
					bodyType: 'text',
					text: 'Milk, eggs, bread',
				},
			});
			httpRequestWithAuthentication.mockResolvedValueOnce(sampleTextNote);

			const result = await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://keep.googleapis.com/v1/notes',
					body: { title: 'Shopping list', body: { text: { text: 'Milk, eggs, bread' } } },
				}),
			);
			expect(result[0][0].json).toEqual(sampleTextNote);
		});

		it('creates a body.list checklist note from checklist items', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'note',
					operation: 'create',
					title: 'Todo',
					bodyType: 'checklist',
					listItemsUi: {
						listItemValues: [
							{ text: 'Buy stamps', checked: false },
							{ text: 'Mail letter', checked: true },
						],
					},
				},
			});
			httpRequestWithAuthentication.mockResolvedValueOnce(sampleChecklistNote);

			const result = await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://keep.googleapis.com/v1/notes',
					body: {
						title: 'Todo',
						body: {
							list: {
								listItems: [
									{ text: 'Buy stamps', checked: false },
									{ text: 'Mail letter', checked: true },
								],
							},
						},
					},
				}),
			);
			expect(result[0][0].json).toEqual(sampleChecklistNote);
		});

		it('defaults a checklist item with no explicit "checked" value to unchecked', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'note',
					operation: 'create',
					title: 'Todo',
					bodyType: 'checklist',
					listItemsUi: { listItemValues: [{ text: 'Buy stamps' }] },
				},
			});
			httpRequestWithAuthentication.mockResolvedValueOnce(sampleChecklistNote);

			await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					body: {
						title: 'Todo',
						body: { list: { listItems: [{ text: 'Buy stamps', checked: false }] } },
					},
				}),
			);
		});

		it('fails validation before any HTTP request when neither title nor body content is given', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'create', bodyType: 'text' },
			});

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/title or body content/,
			);
			expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
		});

		it('fails validation before any HTTP request when bodyType is checklist with no items and no title', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'create', bodyType: 'checklist' },
			});

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/title or body content/,
			);
			expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
		});
	});

	describe('Delete', () => {
		it('deletes an existing note by ID', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'delete', noteId: 'abc123' },
			});
			httpRequestWithAuthentication.mockResolvedValueOnce({});

			const result = await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					method: 'DELETE',
					url: 'https://keep.googleapis.com/v1/notes/abc123',
				}),
			);
			expect(result[0][0].json).toEqual({ success: true });
		});

		it('produces a not-found error for a nonexistent note ID', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'delete', noteId: 'missing' },
			});
			httpRequestWithAuthentication.mockRejectedValueOnce(notFoundError);

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/could not be found/,
			);
		});

		it('suppresses the not-found error only when continueOnFail is enabled', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'delete', noteId: 'missing' },
				continueOnFail: true,
			});
			httpRequestWithAuthentication.mockRejectedValueOnce(notFoundError);

			const result = await new GoogleKeep().execute.call(context);

			expect(result[0][0].json.error).toMatch(/could not be found/);
		});
	});

	describe('Unsupported operation', () => {
		it('rejects with a NodeOperationError instead of calling the API', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'note', operation: 'notARealOperation' },
			});

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/not supported for resource "note"/,
			);
			expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
		});
	});

	// FR-010: the API has no update/edit capability on note content, so the UI must not offer one.
	describe('FR-010 - no update/edit operation', () => {
		it('does not expose an update or edit operation on the Note resource', () => {
			const operationProperty = noteOperations.find((property) => property.name === 'operation');
			const values = (operationProperty?.options as Array<{ value: string }>).map(
				(option) => option.value,
			);

			expect(values).not.toContain('update');
			expect(values).not.toContain('edit');
		});
	});
});
