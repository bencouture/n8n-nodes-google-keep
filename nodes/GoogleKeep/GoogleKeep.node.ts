import type {
	IBinaryKeyData,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionType, NodeOperationError } from 'n8n-workflow';

import { noteFields, noteOperations } from './descriptions/NoteDescription';
import { permissionFields, permissionOperations } from './descriptions/PermissionDescription';
import { attachmentFields, attachmentOperations } from './descriptions/AttachmentDescription';
import { googleKeepApiRequest, googleKeepApiRequestAllItems } from './GenericFunctions';

export class GoogleKeep implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Keep',
		name: 'googleKeep',
		icon: 'file:googleKeep.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume the Google Keep API',
		defaults: {
			name: 'Google Keep',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'googleKeepServiceAccountApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Attachment', value: 'attachment' },
					{ name: 'Note', value: 'note' },
					{ name: 'Permission', value: 'permission' },
				],
				default: 'note',
			},
			...noteOperations,
			...noteFields,
			...permissionOperations,
			...permissionFields,
			...attachmentOperations,
			...attachmentFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const operation = this.getNodeParameter('operation', itemIndex) as string;

			try {
				let responseData: IDataObject | IDataObject[] = {};
				let binaryData: IBinaryKeyData | undefined;

				if (resource === 'note') {
					if (operation === 'get') {
						const noteId = this.getNodeParameter('noteId', itemIndex) as string;
						responseData = await googleKeepApiRequest.call(this, 'GET', `/v1/notes/${noteId}`);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const limit = returnAll
							? 0
							: (this.getNodeParameter('limit', itemIndex) as number);
						responseData = await googleKeepApiRequestAllItems.call(
							this,
							'notes',
							'GET',
							'/v1/notes',
							{},
							{},
							returnAll,
							limit,
						);
					} else if (operation === 'create') {
						const title = this.getNodeParameter('title', itemIndex, '') as string;
						const bodyType = this.getNodeParameter('bodyType', itemIndex) as string;
						const body: IDataObject = {};

						if (bodyType === 'text') {
							const text = this.getNodeParameter('text', itemIndex, '') as string;
							if (text) body.text = { text };
						} else {
							const listItemsUi = this.getNodeParameter(
								'listItemsUi',
								itemIndex,
								{},
							) as IDataObject;
							const listItemValues = (listItemsUi.listItemValues as IDataObject[]) ?? [];
							if (listItemValues.length) {
								body.list = {
									listItems: listItemValues.map((item) => ({
										text: item.text,
										checked: item.checked ?? false,
									})),
								};
							}
						}

						if (!title && Object.keys(body).length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'Provide a title or body content (text or checklist items) to create a note',
								{ itemIndex },
							);
						}

						const notePayload: IDataObject = {};
						if (title) notePayload.title = title;
						if (Object.keys(body).length) notePayload.body = body;

						responseData = await googleKeepApiRequest.call(this, 'POST', '/v1/notes', notePayload);
					} else if (operation === 'delete') {
						const noteId = this.getNodeParameter('noteId', itemIndex) as string;
						await googleKeepApiRequest.call(this, 'DELETE', `/v1/notes/${noteId}`);
						responseData = { success: true };
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "note"`,
							{ itemIndex },
						);
					}
				} else if (resource === 'permission') {
					const noteId = this.getNodeParameter('noteId', itemIndex) as string;

					if (operation === 'add') {
						const email = this.getNodeParameter('email', itemIndex) as string;
						const role = this.getNodeParameter('role', itemIndex) as string;
						const addResponse = await googleKeepApiRequest.call(
							this,
							'POST',
							`/v1/notes/${noteId}/permissions:batchCreate`,
							{ permissions: [{ role, email }] },
						);
						responseData = (addResponse.permissions as IDataObject[]) ?? [];
					} else if (operation === 'list') {
						const note = await googleKeepApiRequest.call(this, 'GET', `/v1/notes/${noteId}`);
						responseData = (note.permissions as IDataObject[]) ?? [];
					} else if (operation === 'remove') {
						const permissionId = this.getNodeParameter('permissionId', itemIndex) as string;
						await googleKeepApiRequest.call(
							this,
							'POST',
							`/v1/notes/${noteId}/permissions:batchDelete`,
							{ names: [`notes/${noteId}/permissions/${permissionId}`] },
						);
						responseData = { success: true };
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "permission"`,
							{ itemIndex },
						);
					}
				} else if (resource === 'attachment') {
					if (operation === 'download') {
						const noteId = this.getNodeParameter('noteId', itemIndex) as string;
						const attachmentName = this.getNodeParameter(
							'attachmentName',
							itemIndex,
							'',
						) as string;

						const note = await googleKeepApiRequest.call(this, 'GET', `/v1/notes/${noteId}`);
						const attachments = (note.attachments as IDataObject[]) ?? [];
						const attachment = attachmentName
							? attachments.find((item) => item.name === attachmentName)
							: attachments[0];

						if (!attachment) {
							throw new NodeOperationError(
								this.getNode(),
								'No attachment found on this note',
								{ itemIndex },
							);
						}

						const mimeType =
							(this.getNodeParameter('mimeType', itemIndex, '') as string) ||
							(attachment.mimeType as string);

						const mediaContent = (await googleKeepApiRequest.call(
							this,
							'GET',
							`/v1/media/${attachment.name}`,
							{},
							{ alt: 'media', mimeType },
							{ json: false, encoding: 'arraybuffer' },
						)) as unknown as Buffer;

						binaryData = {
							data: await this.helpers.prepareBinaryData(
								Buffer.from(mediaContent),
								undefined,
								mimeType,
							),
						};
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "attachment"`,
							{ itemIndex },
						);
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: itemIndex } },
				);
				if (binaryData) {
					for (const entry of executionData) {
						entry.binary = binaryData;
					}
				}
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					// eslint-disable-next-line @n8n/community-nodes/require-node-api-error -- already the right error type (checked above); wrapping again would lose it
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [returnData];
	}
}
