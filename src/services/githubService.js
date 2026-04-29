const GITHUB_API = 'https://api.github.com';

export const getDefaultBranchSha = async (token, owner, repo, baseBranch = null) => {
  const candidates = baseBranch ? [baseBranch] : ['main', 'master', 'develop'];
  for (const branch of candidates) {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    });
    if (res.ok) {
      const data = await res.json();
      return { sha: data.object.sha, branch };
    }
  }
  throw new Error(baseBranch ? `Rama "${baseBranch}" no encontrada` : 'No se encontro rama base (main/master/develop)');
};

export const listRepoBranches = async (token, owner, repo) => {
  const all = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/branches?per_page=100&page=${page}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`Error ${res.status} al obtener ramas`);
    const data = await res.json();
    all.push(...data.map(b => b.name));
    if (data.length < 100) break;
    page++;
  }
  return all;
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

export const deleteGithubBranch = async (token, owner, repo, branchName) => {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  });
  if (!res.ok && res.status !== 422) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
};

export const getPRStatus = async (token, owner, repo, prNumber) => {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return { state: data.merged ? 'merged' : data.state, url: data.html_url };
};

export const createGithubPR = async (token, owner, repo, { title, body, head, base }) => {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, body: body || '', head, base })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.errors?.[0]?.message || err.message || `Error ${res.status}`;
    if (detail.includes('No commits between')) throw new Error('La rama no tiene commits nuevos. Sube cambios antes de crear el PR.');
    if (detail.includes('already exists')) throw new Error('Ya existe un PR abierto para esta rama.');
    throw new Error(detail);
  }
  return res.json();
};

export const listUserRepos = async (token) => {
  const all = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${GITHUB_API}/user/repos?per_page=100&page=${page}&sort=updated&type=all`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`Error ${res.status} al obtener repositorios`);
    const data = await res.json();
    all.push(...data.map(r => r.full_name));
    if (data.length < 100) break;
    page++;
  }
  return all;
};
