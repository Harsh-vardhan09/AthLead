export const MAX_OPEN_ASSIGNMENTS = 3;

// Open issues (not PRs) currently assigned to the user in this repo
export const getOpenAssignments = async (github, owner, repo, username) => {
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    owner,
    repo,
    assignee: username,
    state: "open",
    per_page: 100,
  });
  return issues.filter((issue) => !issue.pull_request);
};

export const limitReachedMessage = (username, openIssues) =>
  `⛔ @${username} already has **${openIssues.length}** open assigned issues (${openIssues
    .map((i) => `#${i.number}`)
    .join(", ")}). A contributor can only work on ${MAX_OPEN_ASSIGNMENTS} issues at a time. Please complete or close one of them before taking a new issue.`;
