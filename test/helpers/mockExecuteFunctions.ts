import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	IPairedItemData,
} from 'n8n-workflow';

interface MockExecuteFunctionsOptions {
	items?: INodeExecutionData[];
	params?: Record<string, unknown>;
	continueOnFail?: boolean;
}

export function createMockExecuteFunctions(options: MockExecuteFunctionsOptions = {}) {
	const items = options.items ?? [{ json: {} }];
	const params = options.params ?? {};
	const httpRequestWithAuthentication = jest.fn();
	const prepareBinaryData = jest.fn(async (data: Buffer, fileName?: string, mimeType?: string) => ({
		data: data.toString('base64'),
		fileName,
		mimeType,
	}));

	const context = {
		getInputData: () => items,
		getNodeParameter: (name: string, itemIndex: number, fallback?: unknown) => {
			const scopedKey = `${itemIndex}:${name}`;
			if (scopedKey in params) return params[scopedKey];
			if (name in params) return params[name];
			return fallback;
		},
		getNode: () => ({ name: 'Google Keep', type: 'n8n-nodes-google-keep.googleKeep' }),
		continueOnFail: () => options.continueOnFail ?? false,
		helpers: {
			httpRequestWithAuthentication,
			prepareBinaryData,
			returnJsonArray: (data: IDataObject | IDataObject[]): INodeExecutionData[] =>
				(Array.isArray(data) ? data : [data]).map((json) => ({ json })),
			constructExecutionMetaData: (
				inputData: INodeExecutionData[],
				metadata: { itemData: IPairedItemData },
			): INodeExecutionData[] =>
				inputData.map((entry) => ({ ...entry, pairedItem: metadata.itemData })),
		},
	};

	return {
		context: context as unknown as IExecuteFunctions,
		httpRequestWithAuthentication,
		prepareBinaryData,
	};
}
