import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET ?? "tasiyolojistik-fallback-secret-32b!";
  return createHash("sha256").update(secret).digest();
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(token: string): string {
  try {
    const parts = token.split(":");
    if (parts.length !== 2) return token;
    const [ivHex, encryptedHex] = parts;
    if (!/^[0-9a-f]+$/i.test(ivHex) || !/^[0-9a-f]+$/i.test(encryptedHex)) return token;
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = createDecipheriv("aes-256-cbc", key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return token;
  }
}

export function maskSensitive(plain: string): string {
  if (!plain) return "";
  const len = plain.length;
  if (len <= 4) return "****";
  const visible = Math.min(4, len);
  return "*".repeat(len - visible) + plain.slice(-visible);
}
