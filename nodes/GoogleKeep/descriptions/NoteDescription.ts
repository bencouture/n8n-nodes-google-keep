import type { INodeProperties } from 'n8n-workflow';

export const noteOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['note'] } },
		options: [
			{ name: 'Get', value: 'get', action: 'Get a note' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many notes' },
			{ name: 'Create', value: 'create', action: 'Create a note' },
			{ name: 'Delete', value: 'delete', action: 'Delete a note' },
		],
		default: 'get',
	},
];

export const noteFields: INodeProperties[] = [
	{
		displayName: 'Note ID',
		name: 'noteId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['note'], operation: ['get', 'delete'] } },
		description: 'ID of the note, i.e. the trailing segment of its "name" (notes/{noteId}).',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['note'], operation: ['getAll'] } },
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		displayOptions: {
			show: { resource: ['note'], operation: ['getAll'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['note'], operation: ['create'] } },
	},
	{
		displayName: 'Body Type',
		name: 'bodyType',
		type: 'options',
		options: [
			{ name: 'Text', value: 'text' },
			{ name: 'Checklist', value: 'checklist' },
		],
		default: 'text',
		displayOptions: { show: { resource: ['note'], operation: ['create'] } },
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		displayOptions: {
			show: { resource: ['note'], operation: ['create'], bodyType: ['text'] },
		},
	},
	{
		displayName: 'Checklist Items',
		name: 'listItemsUi',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Item',
		default: {},
		displayOptions: {
			show: { resource: ['note'], operation: ['create'], bodyType: ['checklist'] },
		},
		options: [
			{
				displayName: 'Item',
				name: 'listItemValues',
				values: [
					{ displayName: 'Text', name: 'text', type: 'string', default: '' },
					{ displayName: 'Checked', name: 'checked', type: 'boolean', default: false },
				],
			},
		],
	},
];
