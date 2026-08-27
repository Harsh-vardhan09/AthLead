export const handleAssign = async ({
  context,
  issueNumber,
  assignees,
  hasWriteAccess,
}) => {
  const { owner, repo } = context.repo;
  const issueNumber = context.payload.issue.number;
  const issueState = context.payload.issue.state;
  const commenter = context.payload.comment.user.login;

  if (!hasWriteAccess) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `⛔ @${commenter}, you don't have permission to use \`/assign\`. Only maintainers and collaborators with write access can assign issues.`,
    });
    return;
  }

  if (issueState === "closed") {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ Commands cannot be used on closed issues.`,
    });
    return;
  }

  const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  if (!usernameRegex.test(username)) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ \`@${username}\` is not a valid GitHub username.`,
    });
    return;
  }

 await github.rest.issues.addAssignees({
    owner,
    repo,
    issue_number: issueNumber,
    assignees: [username],
  });

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `✅ Successfully assigned issue to @${username}\n\n> 💡 Please read [CONTRIBUTION.md](../../../CONTRIBUTION.md) and Star the repo. Good luck! 🚀`,
  });
};
