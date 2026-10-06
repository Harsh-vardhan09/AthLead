export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_REQUIREMENTS = [
  "at least 8 characters",
  "at most 64 characters",
  "at most 72 UTF-8 bytes",
  "at least one uppercase letter",
  "at least one lowercase letter",
  "at least one number",
  "at least one special character",
  "no spaces",
];

export const PASSWORD_PATTERN =
  /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;

export const PASSWORD_ERROR_MESSAGE =
  "Use 8-64 characters, at most 72 UTF-8 bytes, with uppercase, lowercase, number, and special character. Spaces are not allowed.";

export const isValidPassword = (password) =>
  typeof password === "string" &&
  new TextEncoder().encode(password).length <= PASSWORD_MAX_BYTES &&
  PASSWORD_PATTERN.test(password);
