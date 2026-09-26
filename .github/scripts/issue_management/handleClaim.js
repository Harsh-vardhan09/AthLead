import {
  MAX_OPEN_ASSIGNMENTS,
  getOpenAssignments,
  limitReachedMessage,
} from "./assignmentLimit.js";

export const handleClaim =async ({ github, context }) => {
  const { owner, repo } = context.repo;
  const issueNumber = context.payload.issue.number;
  const issueState = context.payload.issue.state;
  const commenter = context.payload.comment.user.login;

   if (issueState === 'closed') {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ Commands cannot be used on closed issues.`,
    });
    return;
  }

  // Re-fetch to avoid stale issue/assignee/state data from the webhook payload
  const { data: freshIssue } = await github.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

    const currentAssignees = freshIssue.assignees.map((a) => a.login.toLowerCase());

  if (currentAssignees.length > 0) {
    if (currentAssignees.includes(commenter.toLowerCase())) {
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: `ℹ️ You are already assigned to this issue.`,
      });
      return;
    }
    const assigneeList = currentAssignees.map((a) => `@${a}`).join(', ');
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ This issue is already assigned to ${assigneeList}`,
    });
    return;
  }

  const openIssues = await getOpenAssignments(github, owner, repo, commenter);
  if (openIssues.length >= MAX_OPEN_ASSIGNMENTS) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: limitReachedMessage(commenter, openIssues),
    });
    return;
  }

   await github.rest.issues.addAssignees({
    owner,
    repo,
    issue_number: issueNumber,
    assignees: [commenter],
  });

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `🎉 **Assigned!** Welcome to the project, @${commenter}.\n\n⏳ **Reminder:** You have **5 days** to open a Pull Request linked to this issue. If no PR is linked after 5 days, you will be automatically unassigned to give others a chance.\n\n> 💡 Please read [CONTRIBUTION.md](./../blob/main/CONTRIBUTION.md) and star the repo.\n\nHappy coding! 🚀`,
  });
};
