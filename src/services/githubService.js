const GITHUB_API = 'https://api.github.com';

export const getDefaultBranchSha = async (token, owner, repo) => {
  for (const branch of ['main', 'master', 'develop']) {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    });
    if (res.ok) {
      const data = await res.json();
      return { sha: data.object.sha, branch };
    }
  }
  throw new Error('No se encontro rama base (main/master/develop)');
};

export const createGithubBranch = async (token, owner, repo, branchName, sha) => {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
};
