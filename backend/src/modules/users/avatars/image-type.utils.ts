/** The image types an avatar may have (D11): JPG and JPEG are the same format, `image/jpeg`. */
export type AvatarMimeType = "image/png" | "image/jpeg" | "image/gif";

/**
 * The first bytes ("magic number") that each format starts with. The file name and the type the browser sends
 * can be anything, so only these bytes decide (user profile page: "must not rely only on the file extension").
 */
const SIGNATURES: readonly { mimeType: AvatarMimeType; bytes: readonly number[] }[] = [
  { mimeType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mimeType: "image/gif", bytes: [...Buffer.from("GIF87a")] },
  { mimeType: "image/gif", bytes: [...Buffer.from("GIF89a")] },
];

/** The image type of the file content, or `undefined` when it is not a PNG, JPG or GIF image. */
export function detectImageType(content: Uint8Array): AvatarMimeType | undefined {
  return SIGNATURES.find(({ bytes }) => bytes.every((byte, index) => content[index] === byte))
    ?.mimeType;
}
