import type { INodeProperties } from 'n8n-workflow';

export const permissionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['permission'] } },
		options: [
			{ name: 'Add', value: 'add', action: 'Add a collaborator to a note' },
			{ name: 'List', value: 'list', action: 'List collaborators on a note' },
			{ name: 'Remove', value: 'remove', action: 'Remove a collaborator from a note' },
		],
		default: 'add',
	},
];

export const permissionFields: INodeProperties[] = [
	{
		displayName: 'Note ID',
		name: 'noteId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['permission'] } },
		description: 'ID of the note, i.e. the trailing segment of its "name" (notes/{noteId}).',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'collaborator@example.com',
		displayOptions: { show: { resource: ['permission'], operation: ['add'] } },
		description: "Collaborator's email address",
	},
	{
		displayName: 'Role',
		name: 'role',
		type: 'options',
		options: [
			{ name: 'Writer', value: 'WRITER' },
			{ name: 'Owner', value: 'OWNER' },
		],
		default: 'WRITER',
		displayOptions: { show: { resource: ['permission'], operation: ['add'] } },
	},
	{
		displayName: 'Permission ID',
		name: 'permissionId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['permission'], operation: ['remove'] } },
		description: 'ID of the permission to revoke, i.e. the trailing segment of its "name" (notes/{noteId}/permissions/{permissionId}).',
	},
];
