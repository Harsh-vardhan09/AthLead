import test from "node:test";
import assert from "node:assert/strict";
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_PATTERN,
  isValidPassword,
} from "../utils/passwordValidation.js";

test("accepts a password that meets every requirement", () => {
  assert.equal(isValidPassword("Strong@123"), true);
});

test("rejects passwords shorter than 8 characters", () => {
  assert.equal(isValidPassword("Str@123"), false);
});

test("rejects passwords without an uppercase letter", () => {
  assert.equal(isValidPassword("strong@123"), false);
});

test("rejects passwords without a lowercase letter", () => {
  assert.equal(isValidPassword("STRONG@123"), false);
});

test("rejects passwords without a number", () => {
  assert.equal(isValidPassword("Strong@abc"), false);
});

test("rejects passwords without a special character", () => {
  assert.equal(isValidPassword("Strong123"), false);
});

test("rejects passwords containing whitespace", () => {
  assert.equal(isValidPassword("Strong @123"), false);
});

test("rejects a valid password followed by invalid whitespace", () => {
  assert.equal(PASSWORD_PATTERN.test("Strong@123 "), false);
});

test("rejects a valid password substring when the complete password exceeds the maximum length", () => {
  assert.equal(PASSWORD_PATTERN.test("Strong@123".repeat(7)), false);
});

test("accepts a password at the 72-byte UTF-8 boundary", () => {
  const password = "Aa1@" + "😀".repeat(17);
  assert.equal(Buffer.byteLength(password, "utf8"), PASSWORD_MAX_BYTES);
  assert.equal(isValidPassword(password), true);
});

test("rejects a password that exceeds the 72-byte UTF-8 limit", () => {
  const password = "Aa1@" + "😀".repeat(18);
  assert.equal(Buffer.byteLength(password, "utf8"), PASSWORD_MAX_BYTES + 4);
  assert.equal(isValidPassword(password), false);
});

test("rejects an empty password", () => {
  assert.equal(isValidPassword(""), false);
});
