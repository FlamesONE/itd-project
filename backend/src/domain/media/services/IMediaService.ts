export interface MediaVariant {
  type: string;
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface MediaUploadResult {
  id: string;
  variants: MediaVariant[];
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  mimeType: string;
}

export interface IMediaService {
  uploadImage(
    file: Buffer,
    userId: string,
    filename: string
  ): Promise<MediaUploadResult>;

  deleteMedia(userId: string, fileId: string): Promise<void>;

  getUrl(path: string): string;
}
