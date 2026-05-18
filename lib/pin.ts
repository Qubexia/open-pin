export const OWNER_FIXED_PIN = "123456";

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPin(pin: string, hash?: string): Promise<boolean> {
  if (!hash) return false;
  return (await hashPin(pin)) === hash;
}
