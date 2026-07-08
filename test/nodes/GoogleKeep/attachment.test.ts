import { GoogleKeep } from '../../../nodes/GoogleKeep/GoogleKeep.node';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('GoogleKeep node - Attachment resource', () => {
	describe('Download', () => {
		it('returns binary data with the correct MIME type for a note with an attachment', async () => {
			const { context, httpRequestWithAuthentication, prepareBinaryData } =
				createMockExecuteFunctions({
					params: { resource: 'attachment', operation: 'download', noteId: 'abc123' },
				});
			httpRequestWithAuthentication
				.mockResolvedValueOnce({
					name: 'notes/abc123',
					attachments: [
						{ name: 'notes/abc123/attachments/att1', mimeType: 'image/png' },
					],
				})
				.mockResolvedValueOnce(Buffer.from('fake-image-bytes'));

			const result = await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenNthCalledWith(
				2,
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					method: 'GET',
					url: 'https://keep.googleapis.com/v1/media/notes/abc123/attachments/att1',
					qs: expect.objectContaining({ alt: 'media', mimeType: 'image/png' }),
				}),
			);
			expect(prepareBinaryData).toHaveBeenCalledWith(
				Buffer.from('fake-image-bytes'),
				undefined,
				'image/png',
			);
			expect(result[0][0].binary?.data).toEqual({
				data: Buffer.from('fake-image-bytes').toString('base64'),
				fileName: undefined,
				mimeType: 'image/png',
			});
		});

		it('returns a clear "no attachment found" error for a note with no attachments', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'attachment', operation: 'download', noteId: 'abc123' },
			});
			httpRequestWithAuthentication.mockResolvedValueOnce({
				name: 'notes/abc123',
				attachments: [],
			});

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/no attachment found/i,
			);
			expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
		});

		it('returns a clear "no attachment found" error when the "attachments" key is absent entirely', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'attachment', operation: 'download', noteId: 'abc123' },
			});
			httpRequestWithAuthentication.mockResolvedValueOnce({ name: 'notes/abc123' });

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/no attachment found/i,
			);
		});

		it('downloads the attachment matching the given attachmentName when a note has several', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'attachment',
					operation: 'download',
					noteId: 'abc123',
					attachmentName: 'notes/abc123/attachments/att2',
				},
			});
			httpRequestWithAuthentication
				.mockResolvedValueOnce({
					name: 'notes/abc123',
					attachments: [
						{ name: 'notes/abc123/attachments/att1', mimeType: 'image/png' },
						{ name: 'notes/abc123/attachments/att2', mimeType: 'image/jpeg' },
					],
				})
				.mockResolvedValueOnce(Buffer.from('second-attachment-bytes'));

			await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenNthCalledWith(
				2,
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					url: 'https://keep.googleapis.com/v1/media/notes/abc123/attachments/att2',
					qs: expect.objectContaining({ mimeType: 'image/jpeg' }),
				}),
			);
		});

		it('returns a clear "no attachment found" error when attachmentName matches none of the note\'s attachments', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'attachment',
					operation: 'download',
					noteId: 'abc123',
					attachmentName: 'notes/abc123/attachments/does-not-exist',
				},
			});
			httpRequestWithAuthentication.mockResolvedValueOnce({
				name: 'notes/abc123',
				attachments: [{ name: 'notes/abc123/attachments/att1', mimeType: 'image/png' }],
			});

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/no attachment found/i,
			);
			expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
		});

		it('lets an explicit MIME Type parameter override the attachment\'s own MIME type', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: {
					resource: 'attachment',
					operation: 'download',
					noteId: 'abc123',
					mimeType: 'application/octet-stream',
				},
			});
			httpRequestWithAuthentication
				.mockResolvedValueOnce({
					name: 'notes/abc123',
					attachments: [{ name: 'notes/abc123/attachments/att1', mimeType: 'image/png' }],
				})
				.mockResolvedValueOnce(Buffer.from('bytes'));

			await new GoogleKeep().execute.call(context);

			expect(httpRequestWithAuthentication).toHaveBeenNthCalledWith(
				2,
				'googleKeepServiceAccountApi',
				expect.objectContaining({
					qs: expect.objectContaining({ mimeType: 'application/octet-stream' }),
				}),
			);
		});
	});

	describe('Unsupported operation', () => {
		it('rejects with a NodeOperationError instead of calling the API', async () => {
			const { context, httpRequestWithAuthentication } = createMockExecuteFunctions({
				params: { resource: 'attachment', operation: 'notARealOperation' },
			});

			await expect(new GoogleKeep().execute.call(context)).rejects.toThrow(
				/not supported for resource "attachment"/,
			);
			expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
		});
	});
});
