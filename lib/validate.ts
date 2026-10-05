// Form-side mirrors of the API's checks (before-you-dispatch-api's
// src/lib/validate.ts and src/lib/phone.ts), so a mistake is caught before a
// request is sent. The API checks again and is the one that counts: keep the
// two in step.

export const EMAIL_ERROR = "Enter a valid email address, like name@example.com";
export const PHONE_ERROR =
  "Enter a valid phone number, like 0803 123 4567 or +234 803 123 4567";

const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export function isValidEmail(email: string): boolean {
  const value = email.trim();
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

// Nigerian mobile numbers (local or +234 form) or an international number
// with an explicit "+". See the API's phone.ts for the full rules.
const ALLOWED_PHONE_CHARACTERS = /^\+?[\d\s\-().]+$/;
const NIGERIAN_MOBILE = /^234[789][01]\d{8}$/;

export function isValidPhone(raw: string): boolean {
  const value = raw.trim();
  if (!ALLOWED_PHONE_CHARACTERS.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  const international = value.startsWith("+");

  if (!international && digits.startsWith("0")) {
    return NIGERIAN_MOBILE.test(`234${digits.slice(1)}`) && digits.length === 11;
  }
  if (NIGERIAN_MOBILE.test(digits)) return true;
  if (!international && NIGERIAN_MOBILE.test(`234${digits}`)) return true;
  if (digits.startsWith("234")) return false;
  return international && /^[1-9]\d{7,14}$/.test(digits);
}

// Strong-password rule, mirroring the API's isStrongPassword. Only for
// choosing a password (sign-up, reset, change), never log-in.
export const PASSWORD_ERROR =
  "Password must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol";

export const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
  { label: "A symbol, like ! or @", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
];

export function isStrongPassword(password: string): boolean {
  return password.length <= 72 && PASSWORD_RULES.every((r) => r.test(password));
}
