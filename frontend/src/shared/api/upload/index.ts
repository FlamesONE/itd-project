const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || '/upload';

export interface UploadedMedia {
	id: string;
	url: string;
	thumbnailUrl: string;
	width: number | null;
	height: number | null;
	mimeType: string;
}

export interface UploadError {
	error: string;
}

export async function uploadMedia(file: File, token: string): Promise<UploadedMedia> {
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch(UPLOAD_URL, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
		},
		body: formData,
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error((data as UploadError).error || 'Upload failed');
	}

	return data as UploadedMedia;
}

export async function uploadMultipleMedia(files: File[], token: string): Promise<UploadedMedia[]> {
	const results: UploadedMedia[] = [];

	for (const file of files) {
		try {
			const result = await uploadMedia(file, token);
			results.push(result);
		} catch (error) {
			console.error('Failed to upload file:', file.name, error);
		}
	}

	return results;
}
