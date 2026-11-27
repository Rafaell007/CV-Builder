import { hash, verify } from "@node-rs/argon2";

/** Hashes a password with argon2id (library defaults). The result includes its own salt. */
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

/** `true` when the password matches the hash. A malformed hash counts as a mismatch and never throws. */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
