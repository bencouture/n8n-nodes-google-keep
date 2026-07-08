import type { INodeProperties } from 'n8n-workflow';

export const attachmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['attachment'] } },
		options: [{ name: 'Download', value: 'download', action: 'Download an attachment' }],
		default: 'download',
	},
];

export const attachmentFields: INodeProperties[] = [
	{
		displayName: 'Note ID',
		name: 'noteId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['attachment'], operation: ['download'] } },
		description: 'ID of the note the attachment belongs to',
	},
	{
		displayName: 'Attachment Name',
		name: 'attachmentName',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['attachment'], operation: ['download'] } },
		description:
			'Resource name of the attachment (from the note\'s "attachments" field). Leave empty to use the note\'s only attachment.',
	},
	{
		displayName: 'MIME Type',
		name: 'mimeType',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['attachment'], operation: ['download'] } },
		description: "Overrides the attachment's own MIME type when requesting the download variant",
	},
];
