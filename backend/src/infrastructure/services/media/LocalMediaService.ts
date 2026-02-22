import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuid } from "uuid";
import type {
  IMediaService,
  MediaUploadResult,
  MediaVariant,
} from "../../../domain/media";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "audio/webm", "audio/mpeg", "audio/ogg", "audio/wav"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export class LocalMediaService implements IMediaService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(config?: { uploadDir?: string; baseUrl?: string }) {
    this.uploadDir = config?.uploadDir || path.join(process.cwd(), "uploads");
    this.baseUrl = config?.baseUrl || "/uploads";
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create upload directory:", error);
    }
  }

  async uploadImage(
    file: Buffer,
    userId: string,
    filename: string
  ): Promise<MediaUploadResult> {
    if (file.length > MAX_FILE_SIZE) {
      throw new Error("File too large. Maximum size is 10MB");
    }

    const mimeType = this.detectMimeType(file);
    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new Error(`Invalid file type: ${mimeType}. Allowed: ${ALLOWED_TYPES.join(", ")}`);
    }

    const fileId = uuid();
    const timestamp = Date.now();
    const ext = this.getExtension(mimeType);

    const userDir = path.join(this.uploadDir, userId);
    await fs.mkdir(userDir, { recursive: true });

    const originalFilename = `${fileId}_${timestamp}${ext}`;
    const filePath = path.join(userDir, originalFilename);
    await fs.writeFile(filePath, file);

    const url = `${this.baseUrl}/${userId}/${originalFilename}`;

    const variants: MediaVariant[] = [
      {
        type: "original",
        url,
        width: 0,
        height: 0,
        size: file.length,
      },
    ];

    return {
      id: fileId,
      variants,
      url,
      thumbnailUrl: url,
      width: 0,
      height: 0,
      mimeType,
    };
  }

  async deleteMedia(userId: string, fileId: string): Promise<void> {
    const userDir = path.join(this.uploadDir, userId);

    try {
      const files = await fs.readdir(userDir);
      for (const file of files) {
        if (file.includes(fileId)) {
          await fs.unlink(path.join(userDir, file));
        }
      }
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  }

  getUrl(filePath: string): string {
    return `${this.baseUrl}/${filePath}`;
  }

  private detectMimeType(buffer: Buffer): string {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }
    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46
    ) {
      return "image/gif";
    }
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46
    ) {
      if (
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      ) {
        return "image/webp";
      }
      if (
        buffer[8] === 0x57 &&
        buffer[9] === 0x41 &&
        buffer[10] === 0x56 &&
        buffer[11] === 0x45
      ) {
        return "audio/wav";
      }
    }

    if (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    ) {
      return "audio/webm";
    }

    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      return "audio/mpeg";
    }
    if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
      return "audio/mpeg";
    }

    if (
      buffer[0] === 0x4f &&
      buffer[1] === 0x67 &&
      buffer[2] === 0x67 &&
      buffer[3] === 0x53
    ) {
      return "audio/ogg";
    }

    return "application/octet-stream";
  }

  private getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "audio/webm": ".webm",
      "audio/mpeg": ".mp3",
      "audio/ogg": ".ogg",
      "audio/wav": ".wav",
    };
    return extensions[mimeType] || ".bin";
  }
}
