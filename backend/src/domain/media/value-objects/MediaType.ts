export enum MediaType {
  IMAGE = "image",
  AVATAR = "avatar",
  COVER = "cover",
}

export function isValidMediaType(value: string): value is MediaType {
  return Object.values(MediaType).includes(value as MediaType);
}
