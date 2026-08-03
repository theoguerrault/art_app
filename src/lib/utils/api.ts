export const apiClient = {
	get: async (url: string, options?: RequestInit) => {
		return globalThis.fetch(url, { ...options, method: 'GET' });
	},
	post: async (url: string, body?: any, options?: RequestInit) => {
		return globalThis.fetch(url, {
			...options,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(options?.headers || {})
			},
			body: body ? JSON.stringify(body) : undefined
		});
	},
	patch: async (url: string, body?: any, options?: RequestInit) => {
		return globalThis.fetch(url, {
			...options,
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				...(options?.headers || {})
			},
			body: body ? JSON.stringify(body) : undefined
		});
	},
	delete: async (url: string, options?: RequestInit) => {
		return globalThis.fetch(url, { ...options, method: 'DELETE' });
	},
	request: async (url: string, options?: RequestInit) => {
		return globalThis.fetch(url, options);
	}
};
