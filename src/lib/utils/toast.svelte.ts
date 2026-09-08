type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

class ToastStore {
	toasts = $state<ToastItem[]>([]);

	show(message: string, type: ToastType = 'info', duration = 4000) {
		const id = Math.random().toString(36).substring(2, 9);
		this.toasts = [...this.toasts, { id, type, message, duration }];
		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}
	}

	success(message: string, duration = 3500) {
		this.show(message, 'success', duration);
	}

	error(message: string, duration = 5000) {
		this.show(message, 'error', duration);
	}

	warning(message: string, duration = 4500) {
		this.show(message, 'warning', duration);
	}

	info(message: string, duration = 3500) {
		this.show(message, 'info', duration);
	}

	dismiss(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toast = new ToastStore();
