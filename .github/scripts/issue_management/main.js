import { handleAssign } from "./assignIssue.js";
import { handleClaim } from "./handleClaim.js";
import { parseCommand } from "./parseCommand.js";
import { hasWriteAccess } from "./permission.js";

export const handler = async (github, context, core) => {
  const commentBody = context.payload.comment?.body;
  const commenter = context.payload.comment?.user?.login;
  const { owner, repo } = context.repo;
  const issueNumber = context.payload.issue?.number;

  if (!context.payload.issue) return;
  if (context.payload.comment?.user?.type === "Bot") return;

  const parsed = parseCommand(commentBody);
  if (!parsed) return;

  let writerAccess = null;
  const writeRestrictedCommands = ["assign", "unassign"];

  if (writeRestrictedCommands.includes(parsed.command)) {
    writerAccess = await hasWriteAccess(github, owner, repo, commenter);
  }

  try {
    switch (parsed.command) {
      case "assign":
        await handleAssign({
          github,
          context,
          issueNumber,
          username: parsed.username,
          hasWriteAccess: writerAccess,
        });
        break;
      case "claim":
        await handleClaim({ github, context });
        break;
    }
  } catch (error) {
    core.error(`Error processing command /${parsed.command}: ${error.message}`);
    core.setFailed(error.message);
  }
};
