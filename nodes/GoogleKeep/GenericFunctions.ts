import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

const KEEP_API_BASE_URL = 'https://keep.googleapis.com';

function getErrorStatusCode(error: JsonObject): number | undefined {
	const candidate =
		(error.statusCode as number | string | undefined) ??
		(error.httpCode as number | string | undefined) ??
		((error.response as JsonObject | undefined)?.status as number | string | undefined) ??
		((error.cause as JsonObject | undefined)?.response as JsonObject | undefined)?.status;
	return candidate === undefined ? undefined : Number(candidate);
}

export async function googleKeepApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	option: IDataObject = {},
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${KEEP_API_BASE_URL}${endpoint}`,
		body,
		qs,
		json: true,
		...option,
	};

	if (Object.keys(body).length === 0) delete options.body;
	if (Object.keys(qs).length === 0) delete options.qs;

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'googleKeepServiceAccountApi',
			options,
		)) as IDataObject;
	} catch (error) {
		const statusCode = getErrorStatusCode(error as JsonObject);
		if (statusCode === 400) {
			throw new NodeOperationError(this.getNode(), error as Error);
		}
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			// Normalize explicitly: some error shapes carry a numeric httpCode/statusCode,
			// but NodeApiError.httpCode is typed (and elsewhere assumed) to be a string.
			httpCode: statusCode !== undefined ? String(statusCode) : undefined,
		});
	}
}

export async function googleKeepApiRequestAllItems(
	this: IExecuteFunctions,
	itemsPropertyName: string,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	returnAll = true,
	limit = 0,
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];
	const query: IDataObject = { ...qs, pageSize: 100 };
	let responseData: IDataObject;

	do {
		responseData = await googleKeepApiRequest.call(this, method, endpoint, body, query);
		returnData.push(...((responseData[itemsPropertyName] as IDataObject[]) ?? []));
		query.pageToken = responseData.nextPageToken;

		if (!returnAll && returnData.length >= limit) {
			return returnData.slice(0, limit);
		}
	} while (responseData.nextPageToken);

	return returnData;
}
