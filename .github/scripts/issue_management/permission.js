export const hasWriteAccess = async (github, owner, repo, username) => {
  try {
    const { data } = await github.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username,
    });
    if (data.permission === "admin" || data.permission === "write") {
      return true;
    }
  } catch (error) {
    if (error.status === 404 || error.status === 403) return false;
    throw error;
  }
};
