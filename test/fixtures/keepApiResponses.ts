export const sampleTextNote = {
	name: 'notes/abc123',
	title: 'Shopping list',
	body: { text: { text: 'Milk, eggs, bread' } },
	createTime: '2026-01-01T00:00:00Z',
	updateTime: '2026-01-01T00:00:00Z',
	trashed: false,
};

export const sampleChecklistNote = {
	name: 'notes/def456',
	title: 'Todo',
	body: {
		list: {
			listItems: [
				{ text: 'Buy stamps', checked: false },
				{ text: 'Mail letter', checked: true },
			],
		},
	},
	createTime: '2026-01-01T00:00:00Z',
	updateTime: '2026-01-01T00:00:00Z',
	trashed: false,
};

export const samplePermission = {
	name: 'notes/abc123/permissions/perm1',
	email: 'collaborator@example.com',
	role: 'WRITER',
};

export const notFoundError = {
	response: {
		status: 404,
		data: { error: { message: 'Requested entity was not found.' } },
	},
	statusCode: 404,
	message: 'Requested entity was not found.',
};

export const invalidArgumentError = {
	statusCode: 400,
	message: 'Invalid value at \'note.title\' (TYPE_STRING), got a number',
};

// Shaped without a top-level statusCode to exercise the response.status fallback.
export const permissionDeniedError = {
	response: {
		status: 403,
		data: { error: { message: 'The caller does not have permission' } },
	},
	message: 'The caller does not have permission',
};

// Shaped with only httpCode to exercise that fallback.
export const rateLimitedError = {
	httpCode: 429,
	message: 'Quota exceeded for quota metric \'Queries\' and limit \'Queries per minute\'',
};
