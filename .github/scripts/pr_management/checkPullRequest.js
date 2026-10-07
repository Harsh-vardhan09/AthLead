import { hasWriteAccess } from "../issue_management/permission.js";

// "Closes #12", "fixes: #12", "Resolves Issue # 12"
const LINK_REGEX =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b[\s:]+(?:issue\s*)?#\s*(\d+)/gi;

// Text under a "## <name>" heading, HTML comments stripped. null if the heading is missing.
export const getSection = (body, name) => {
  const match = body.match(
    new RegExp(`^##\\s*${name}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, "im"),
  );
  return match ? match[1].replace(/<!--[\s\S]*?-->/g, "").trim() : null;
};

export const templateProblems = (body) => {
  const problems = [];
  const description = getSection(body, "Description");
  const typeOfChange = getSection(body, "Type of change");

  if (description === null || getSection(body, "Checklist") === null || typeOfChange === null) {
    problems.push(
      "the PR description does not follow the PR template (the `Description`, `Type of change` and `Checklist` sections are required).",
    );
    return problems;
  }
  if (!description || /^explain what this pr does$/i.test(description)) {
    problems.push("the `Description` section is empty.");
  }
  if (!/^\s*[-*]\s*\[x\]/im.test(typeOfChange)) {
    problems.push("no box is ticked under `Type of change`.");
  }
  return problems;
};

const linkedIssueProblems = async (github, owner, repo, pr) => {
  const author = pr.user.login.toLowerCase();
  const fromBody = [...(pr.body ?? "").matchAll(LINK_REGEX)].map((m) =>
    Number(m[1]),
  );

  // Issues linked through the PR sidebar ("Development") or closing keywords
  const { repository } = await github.graphql(
    `query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          closingIssuesReferences(first: 10) { nodes { number } }
        }
      }
    }`,
    { owner, repo, number: pr.number },
  );
  const fromLinks = repository.pullRequest.closingIssuesReferences.nodes.map(
    (n) => n.number,
  );

  const issueNumbers = [...new Set([...fromBody, ...fromLinks])];
  if (issueNumbers.length === 0) {
    return [
      "this PR is not linked to any issue. Add `Closes #<issue number>` to the PR description.",
    ];
  }

  const issues = await Promise.all(
    issueNumbers.map((issue_number) =>
      github.rest.issues
        .get({ owner, repo, issue_number })
        .then((r) => r.data)
        .catch(() => null),
    ),
  );
  const assignedToAuthor = issues.some(
    (issue) =>
      issue &&
      !issue.pull_request &&
      issue.assignees.some((a) => a.login.toLowerCase() === author),
  );
  if (assignedToAuthor) return [];

  return [
    `the linked issue (${issueNumbers.map((n) => `#${n}`).join(", ")}) is not assigned to you. Comment \`/claim\` on the issue (or ask a maintainer to assign it) before opening a PR.`,
  ];
};

export const checkPullRequest = async (github, context, core) => {
  const { owner, repo } = context.repo;
  const pr = context.payload.pull_request;

  if (pr.user.type === "Bot") return;
  // Maintainers are exempt; also skips re-checking when a maintainer reopens a PR
  if (await hasWriteAccess(github, owner, repo, context.payload.sender.login))
    return;

  const problems = [
    ...templateProblems(pr.body ?? ""),
    ...(await linkedIssueProblems(github, owner, repo, pr)),
  ];

  if (problems.length === 0) {
    core.info(`PR #${pr.number} passed all checks.`);
    return;
  }

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: pr.number,
    body: `⚠️ @${pr.user.login}, this PR has been closed automatically because:\n\n${problems
      .map((p) => `- ${p}`)
      .join("\n")}\n\nFix the PR description (see the [PR template](./../blob/main/.github/pull_request_template.md)), then reopen this PR or open a new one.\n\n> 💡 Please read [CONTRIBUTION.md](./../blob/main/CONTRIBUTION.md) for the contribution workflow.`,
  });

  await github.rest.pulls.update({
    owner,
    repo,
    pull_number: pr.number,
    state: "closed",
  });
};
