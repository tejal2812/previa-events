export const VERIFICATION_STATUSES = ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "SUSPENDED"];
export const DOCUMENT_TYPES = ["PAN", "GSTIN", "BUSINESS_REGISTRATION", "ADDRESS_PROOF", "PORTFOLIO"];
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = new Map([
  ["application/pdf", ".pdf"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

export function documentExtension(file) {
  return ALLOWED_DOCUMENT_TYPES.get(file.type) || null;
}

export function hasValidFileSignature(buffer, mimeType) {
  const bytes = new Uint8Array(buffer).subarray(0, 12);
  if (mimeType === "application/pdf") return new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mimeType === "image/webp") return new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP";
  return false;
}
