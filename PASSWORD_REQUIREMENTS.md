# Password Requirements

AthLead uses the same password policy for new passwords across the frontend and backend.

A password must:

- Be between 8 and 64 characters long.
- Be at most 72 bytes when encoded as UTF-8.
- Contain at least one uppercase letter.
- Contain at least one lowercase letter.
- Contain at least one number.
- Contain at least one special character.
- Not contain whitespace.

The 72-byte limit matches bcrypt's effective input limit and prevents different UTF-8 strings from being treated as the same password after hashing.

Existing users can continue to log in with their existing passwords. The strengthened policy is applied when creating a new account or changing a password; login does not reject an existing password merely because it does not meet the new policy.
