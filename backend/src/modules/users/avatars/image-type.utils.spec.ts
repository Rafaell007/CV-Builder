import { detectImageType } from "./image-type.utils";

const bytes = (...values: number[]): Uint8Array => Uint8Array.from(values);

describe("detectImageType", () => {
  it.each([
    ["a PNG", bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00), "image/png"],
    ["a JPG", bytes(0xff, 0xd8, 0xff, 0xe0, 0x00), "image/jpeg"],
    ["a GIF87a", Buffer.from("GIF87a..."), "image/gif"],
    ["a GIF89a", Buffer.from("GIF89a..."), "image/gif"],
  ])("finds %s by its first bytes", (_name, content, expected) => {
    expect(detectImageType(content)).toBe(expected);
  });

  it.each([
    ["a text file", Buffer.from("hello, I am not an image")],
    ["an HTML page", Buffer.from("<!doctype html><script>alert(1)</script>")],
    ["a WebP image", Buffer.from("RIFF\x00\x00\x00\x00WEBP")],
    ["a PNG cut off after 4 bytes", bytes(0x89, 0x50, 0x4e, 0x47)],
    ["an empty file", bytes()],
  ])("returns undefined for %s", (_name, content) => {
    expect(detectImageType(content)).toBeUndefined();
  });
});
