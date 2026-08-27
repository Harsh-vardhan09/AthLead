export const parseCommand = (body) => {
  if (!body || typeof body !== "string") return null;

  const parts = body.trim().split(/\s+/);

  if (!parts[0].startsWith("/")) {
    return null;
  }

  const name = parts[0].slice(1).toLowerCase();
  const args = parts.slice(1);

  return {
    command: name,
    args,
  };
};
