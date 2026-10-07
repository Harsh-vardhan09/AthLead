import { hasWriteAccess } from "./permission.js";

export const STALE_DAYS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

const ISSUE_QUERY = `query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $number) {
      closedByPullRequestsReferences(first: 20, includeClosedPrs: true) {
        nodes { state author { login } }
      }
      timelineItems(last: 100, itemTypes: [ASSIGNED_EVENT, CROSS_REFERENCED_EVENT]) {
        nodes {
          __typename
          ... on AssignedEvent { createdAt assignee { ... on User { login } } }
          ... on CrossReferencedEvent {
            source { ... on PullRequest { state author { login } } }
          }
        }
      }
    }
  }
}`;

// Assignees who were assigned more than STALE_DAYS ago and have no open/merged PR on the issue
export const staleAssignees = (issue, assignees, now) => {
  const timeline = issue.timelineItems.nodes;
  const prs = [
    ...issue.closedByPullRequestsReferences.nodes,
    ...timeline
      .filter((n) => n.__typename === "CrossReferencedEvent" && n.source?.state)
      .map((n) => n.source),
  ].filter((pr) => pr.state !== "CLOSED" && pr.author);

  return assignees.filter((login) => {
    const lower = login.toLowerCase();
    if (prs.some((pr) => pr.author.login.toLowerCase() === lower)) return false;

    const assignedAt = timeline
      .filter(
        (n) =>
          n.__typename === "AssignedEvent" &&
          n.assignee?.login?.toLowerCase() === lower,
      )
      .map((n) => Date.parse(n.createdAt))
      .pop();
    // No assigned event in the last 100 timeline items means it is old
    return !assignedAt || now - assignedAt > STALE_DAYS * DAY_MS;
  });
};

export const unassignStale = async (github, context, core) => {
  const { owner, repo } = context.repo;
  const now = Date.now();

  const openIssues = (
    await github.paginate(github.rest.issues.listForRepo, {
      owner,
      repo,
      state: "open",
      assignee: "*",
      per_page: 100,
    })
  ).filter((issue) => !issue.pull_request);

  const writeAccess = new Map();
  for (const issue of openIssues) {
    const contributors = [];
    for (const { login } of issue.assignees) {
      if (!writeAccess.has(login)) {
        writeAccess.set(login, await hasWriteAccess(github, owner, repo, login));
      }
      // Maintainers are never auto-unassigned
      if (!writeAccess.get(login)) contributors.push(login);
    }
    if (contributors.length === 0) continue;

    const { repository } = await github.graphql(ISSUE_QUERY, {
      owner,
      repo,
      number: issue.number,
    });
    const stale = staleAssignees(repository.issue, contributors, now);
    if (stale.length === 0) continue;

    await github.rest.issues.removeAssignees({
      owner,
      repo,
      issue_number: issue.number,
      assignees: stale,
    });
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issue.number,
      body: `⏰ ${stale.map((u) => `@${u}`).join(", ")} ${stale.length > 1 ? "have" : "has"} been unassigned because no Pull Request was linked to this issue within ${STALE_DAYS} days.\n\nThis issue is now open for others. Comment \`/claim\` to pick it up.`,
    });
    core.info(`#${issue.number}: unassigned ${stale.join(", ")}`);
  }
};
