import * as http from "http";
import * as url from "url";
import * as fs from "fs";
import * as path from "path";
import { getContainer } from "../../container";
import { JwtTokenService } from "../../infrastructure/services/JwtTokenService";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getAllowedOrigins(): string[] {
	const origins = process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()).filter(Boolean) ?? [];
	if (process.env.NODE_ENV !== "production") {
		origins.push("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000");
	}
	return origins;
}

function parseAuthHeader(authHeader: string | undefined): string | null {
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}
	return authHeader.slice(7);
}

function getCorsHeaders(origin: string | undefined): Record<string, string> {
	const origins = getAllowedOrigins();
	const allowedOrigin = origin && origins.includes(origin) ? origin : origins[0] ?? "";
	return {
		"Access-Control-Allow-Origin": allowedOrigin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Access-Control-Max-Age": "86400",
	};
}

function sendJson(
	res: http.ServerResponse,
	statusCode: number,
	data: Record<string, unknown>,
	origin?: string
): void {
	const headers = {
		"Content-Type": "application/json",
		...getCorsHeaders(origin),
	};
	res.writeHead(statusCode, headers);
	res.end(JSON.stringify(data));
}

function sendError(
	res: http.ServerResponse,
	statusCode: number,
	message: string,
	origin?: string
): void {
	sendJson(res, statusCode, { error: message }, origin);
}

interface MultipartPart {
	name: string;
	filename?: string;
	contentType?: string;
	data: Buffer;
}

function parseMultipart(body: Buffer, boundary: string): MultipartPart[] {
	const parts: MultipartPart[] = [];
	const boundaryBuffer = Buffer.from(`--${boundary}`);
	const endBoundaryBuffer = Buffer.from(`--${boundary}--`);

	let start = 0;
	let idx = body.indexOf(boundaryBuffer, start);

	while (idx !== -1) {
		const nextIdx = body.indexOf(boundaryBuffer, idx + boundaryBuffer.length);
		if (nextIdx === -1) break;

		const partData = body.slice(idx + boundaryBuffer.length, nextIdx);

		const headerEndIdx = partData.indexOf(Buffer.from("\r\n\r\n"));
		if (headerEndIdx === -1) {
			idx = nextIdx;
			continue;
		}

		const headerSection = partData.slice(0, headerEndIdx).toString("utf8");
		const bodySection = partData.slice(headerEndIdx + 4, partData.length - 2);

		const headers: Record<string, string> = {};
		for (const line of headerSection.split("\r\n")) {
			const colonIdx = line.indexOf(":");
			if (colonIdx !== -1) {
				const key = line.slice(0, colonIdx).trim().toLowerCase();
				const value = line.slice(colonIdx + 1).trim();
				headers[key] = value;
			}
		}

		const disposition = headers["content-disposition"] || "";
		const nameMatch = disposition.match(/name="([^"]+)"/);
		const filenameMatch = disposition.match(/filename="([^"]+)"/);

		if (nameMatch) {
			parts.push({
				name: nameMatch[1],
				filename: filenameMatch?.[1],
				contentType: headers["content-type"],
				data: bodySection,
			});
		}

		idx = nextIdx;
	}

	return parts;
}

async function handleUpload(
	req: http.IncomingMessage,
	res: http.ServerResponse,
	origin: string | undefined
): Promise<void> {
	const token = parseAuthHeader(req.headers.authorization);
	if (!token) {
		sendError(res, 401, "Unauthorized: Missing token", origin);
		return;
	}

	const tokenService = new JwtTokenService();
	const tokenPayload = await tokenService.verifyAccessToken(token);
	if (!tokenPayload) {
		sendError(res, 401, "Unauthorized: Invalid token", origin);
		return;
	}

	const userId = tokenPayload.userId;

	const contentType = req.headers["content-type"] || "";
	const boundaryMatch = contentType.match(/boundary=(.+)$/);
	if (!boundaryMatch) {
		sendError(res, 400, "Bad Request: Missing boundary", origin);
		return;
	}

	const boundary = boundaryMatch[1].replace(/^"/, "").replace(/"$/, "");

	const chunks: Buffer[] = [];
	let totalSize = 0;

	for await (const chunk of req) {
		totalSize += chunk.length;
		if (totalSize > MAX_FILE_SIZE) {
			sendError(res, 413, "File too large. Maximum size is 10MB", origin);
			return;
		}
		chunks.push(chunk);
	}

	const body = Buffer.concat(chunks);

	const parts = parseMultipart(body, boundary);
	const filePart = parts.find((p) => p.name === "file" && p.filename);

	if (!filePart) {
		sendError(res, 400, "Bad Request: No file uploaded", origin);
		return;
	}

	const container = getContainer();
	const result = await container.uploadMedia.execute({
		userId,
		file: filePart.data,
		filename: filePart.filename || "upload",
	});

	if (result.isFailure()) {
		sendError(res, 400, result.getError().message, origin);
		return;
	}

	const media = result.getValue();
	sendJson(res, 200, {
		id: media.id,
		url: media.url,
		thumbnailUrl: media.thumbnailUrl,
		width: media.width,
		height: media.height,
		mimeType: media.mimeType,
	}, origin);
}

export function createUploadServer(port: number): http.Server {
	const server = http.createServer(async (req, res) => {
		const origin = req.headers.origin;
		const parsedUrl = url.parse(req.url || "", true);

		if (req.method === "OPTIONS") {
			res.writeHead(204, getCorsHeaders(origin));
			res.end();
			return;
		}

		if (req.method === "POST" && parsedUrl.pathname === "/upload") {
			try {
				await handleUpload(req, res, origin);
			} catch (error) {
				console.error("Upload error:", error);
				sendError(res, 500, "Internal server error", origin);
			}
			return;
		}

		if (req.method === "GET" && parsedUrl.pathname?.startsWith("/uploads/")) {
			try {
				const filePath = path.join(UPLOAD_DIR, parsedUrl.pathname.slice("/uploads/".length));
				const normalizedPath = path.normalize(filePath);

				if (!normalizedPath.startsWith(UPLOAD_DIR)) {
					sendError(res, 403, "Forbidden", origin);
					return;
				}

				if (!fs.existsSync(normalizedPath)) {
					sendError(res, 404, "File not found", origin);
					return;
				}

				const stat = fs.statSync(normalizedPath);
				if (!stat.isFile()) {
					sendError(res, 404, "File not found", origin);
					return;
				}

				const ext = path.extname(normalizedPath).toLowerCase();
				const mimeTypes: Record<string, string> = {
					".jpg": "image/jpeg",
					".jpeg": "image/jpeg",
					".png": "image/png",
					".gif": "image/gif",
					".webp": "image/webp",
					".webm": "audio/webm",
					".mp3": "audio/mpeg",
					".ogg": "audio/ogg",
					".wav": "audio/wav",
				};
				const contentType = mimeTypes[ext] || "application/octet-stream";

				res.writeHead(200, {
					"Content-Type": contentType,
					"Content-Length": stat.size,
					"Cache-Control": "public, max-age=31536000",
					...getCorsHeaders(origin),
				});

				const stream = fs.createReadStream(normalizedPath);
				stream.pipe(res);
				return;
			} catch (error) {
				console.error("Static file error:", error);
				sendError(res, 500, "Internal server error", origin);
				return;
			}
		}

		sendError(res, 404, "Not found", origin);
	});

	server.listen(port, () => {
		console.log(`Upload server ready on port ${port}`);
	});

	return server;
}

export function shutdownUploadServer(server: http.Server): Promise<void> {
	return new Promise((resolve) => {
		server.close(() => {
			console.log("Upload server shut down");
			resolve();
		});
	});
}
