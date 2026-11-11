import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

/**
 * Credentials: enrollment numbers, passwords and password hashes.
 *
 * Passwords are hashed with scrypt rather than bcrypt or argon2 because it
 * is in the Node standard library, so the platform needs no native module
 * and installs on a serverless runtime without a compiler.
 */

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_SALT_LENGTH = 16;

/**
 * The alphabet enrollment numbers are drawn from.
 *
 * Crockford base32: no I, L, O or U, so an enrollment number read aloud
 * or copied off a printed sheet cannot be mistyped into another one.
 */
const ENROLLMENT_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * The alphabet initial passwords are drawn from.
 */
const PASSWORD_ALPHABET =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * How long an enrollment number is.
 */
const ENROLLMENT_LENGTH = 8;

/**
 * How long an initial password is.
 */
const PASSWORD_LENGTH = 12;

/**
 * A random identifier for a row.
 */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

/**
 * A random enrollment number.
 *
 * The caller passes the numbers already in use so a collision is never
 * handed out twice; the chance of one is tiny, but "never" is cheap here.
 */
export function generateEnrollmentNumber(taken: Iterable<string> = []): string {
  const used = new Set<string>();
  for (const value of taken) used.add(value.toUpperCase());

  for (let attempt = 0; attempt < 64; attempt++) {
    const bytes = randomBytes(ENROLLMENT_LENGTH);
    let candidate = "";
    for (const byte of bytes) {
      candidate += ENROLLMENT_ALPHABET[byte % ENROLLMENT_ALPHABET.length];
    }
    if (!used.has(candidate)) return candidate;
  }

  // Sixty-four collisions on an eight character code is not a real
  // probability, but the loop has to end somehow.
  return `T${Date.now().toString(36).toUpperCase().slice(-7)}`;
}

/**
 * A random initial password.
 */
export function generatePassword(): string {
  const bytes = randomBytes(PASSWORD_LENGTH);
  let password = "";
  for (const byte of bytes) {
    password += PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length];
  }
  // At least one digit and one letter, so the password satisfies the
  // usual "mix letters and numbers" guidance without being predictable.
  const digit = bytes[0] % 10;
  const letter = ENROLLMENT_ALPHABET[bytes[1] % ENROLLMENT_ALPHABET.length];
  return `${password.slice(0, PASSWORD_LENGTH - 2)}${letter}${digit}`;
}

/**
 * Hashes a password.
 *
 * The result carries the parameters it was made with, so the cost can be
 * raised later without invalidating the passwords already stored.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_LENGTH);
  const derived = await scrypt(password, salt, SCRYPT_KEY_LENGTH);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

/**
 * Checks a password against a stored hash.
 *
 * Returns false rather than throwing for a malformed hash, so a row with a
 * bad hash locks the account instead of taking the endpoint down.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  try {
    const salt = Buffer.from(parts[1], "base64url");
    const expected = Buffer.from(parts[2], "base64url");
    const derived = await scrypt(password, salt, expected.length);
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * The strength of a password, for the panels to show as it is set.
 */
export function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["very weak", "weak", "fair", "good", "strong"] as const;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  return { score: clamped, label: labels[clamped] };
}
