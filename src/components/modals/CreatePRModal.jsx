import { useState } from 'react';
import Icon from '../common/Icon';
import { createGithubPR, listRepoBranches } from '../../services/githubService';
import { useGitHubDeviceFlow } from '../../hooks/useGitHubDeviceFlow';

const slugify = (text) =>
  (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);

const CreatePRModal = ({ task, project, onClose }) => {
  const repos = project.repositories || [];
  const [prTitle, setPrTitle] = useState(task.title);
  const [headBranch, setHeadBranch] = useState(task.featureBranch || `feature/${slugify(task.title)}`);
  const [selectedRepos, setSelectedRepos] = useState(() => new Set(repos));
  const [repoBaseBranches, setRepoBaseBranches] = useState(() => ({ ...(project.repoBranches || {}) }));
  const [branchOptions, setBranchOptions] = useState({});
  const [loadingBranches, setLoadingBranches] = useState({});
  const [editingBranchRepo, setEditingBranchRepo] = useState(null);
  const [branchSearch, setBranchSearch] = useState({});
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState(null);

  const { token, connect, disconnect } = useGitHubDeviceFlow();

  const toggleRepo = (repo) => {
    setSelectedRepos(prev => {
      const next = new Set(prev);
      if (next.has(repo)) next.delete(repo); else next.add(repo);
      return next;
    });
  };

  const fetchBranchesForRepo = async (repoFull) => {
    if (branchOptions[repoFull] || !token) return;
    setLoadingBranches(prev => ({ ...prev, [repoFull]: true }));
    try {
      const [owner, repo] = repoFull.split('/');
      const branches = await listRepoBranches(token, owner, repo);
      setBranchOptions(prev => ({ ...prev, [repoFull]: branches }));
    } catch {
      // fall back silently
    } finally {
      setLoadingBranches(prev => ({ ...prev, [repoFull]: false }));
    }
  };

  const handleCreate = async () => {
    if (!token || !prTitle.trim() || !headBranch.trim()) return;
    setCreating(true);
    const newResults = {};
    for (const repoFull of repos) {
      if (!selectedRepos.has(repoFull)) continue;
      const [owner, repo] = repoFull.split('/');
      const base = repoBaseBranches[repoFull] || 'main';
      try {
        const pr = await createGithubPR(token, owner, repo, {
          title: prTitle.trim(),
          head: headBranch.trim(),
          base,
        });
        newResults[repoFull] = { success: true, url: pr.html_url };
      } catch (err) {
        newResults[repoFull] = { success: false, error: err.message };
      }
    }
    setResults(newResults);
    setCreating(false);
  };

  const done = results !== null;

  if (!token) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-base">
            <h3 className="heading-3 text-primary flex items-center gap-sm" style={{ margin: 0 }}>
              <Icon name="git-pull-request" size={20} />
              Crear Pull Requests
            </h3>
            <button className="btn btn-icon btn-ghost" onClick={onClose}><Icon name="x" size={18} /></button>
          </div>
          <div className="flex flex-col items-center gap-base p-md text-center">
            <Icon name="git-pull-request" size={40} />
            <p className="text-sm text-secondary">Conecta tu cuenta de GitHub para crear Pull Requests</p>
            <button className="btn btn-primary flex items-center gap-xs" onClick={connect}>
              <Icon name="git-branch" size={16} />
              Conectar con GitHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={done ? onClose : undefined}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-base">
          <h3 className="heading-3 text-primary flex items-center gap-sm" style={{ margin: 0 }}>
            <Icon name="git-pull-request" size={20} />
            Crear Pull Requests
          </h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <p className="text-sm text-secondary mb-base">
          Tarea: <strong className="text-primary">{task.title}</strong>
        </p>

        <div
          className="flex items-center justify-between mb-base p-sm"
          style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}
        >
          <div className="flex items-center gap-xs text-sm text-secondary">
            <Icon name="check-circle" size={14} />
            GitHub conectado
          </div>
          <button className="btn btn-ghost text-xs text-tertiary" onClick={disconnect}>Cambiar cuenta</button>
        </div>

        <div className="form-group">
          <label className="label flex items-center gap-xs">
            <Icon name="git-pull-request" size={14} />
            Titulo del PR
          </label>
          <input
            type="text"
            className="input"
            value={prTitle}
            onChange={e => setPrTitle(e.target.value)}
            disabled={creating || done}
          />
        </div>

        <div className="form-group">
          <label className="label flex items-center gap-xs">
            <Icon name="git-branch" size={14} />
            Rama origen (head)
          </label>
          <input
            type="text"
            className="input"
            value={headBranch}
            onChange={e => setHeadBranch(e.target.value)}
            disabled={creating || done}
            placeholder="feature/mi-tarea"
          />
        </div>

        <div style={{ marginBottom: 'var(--space-base)' }}>
          <div className="label flex items-center gap-xs" style={{ marginBottom: 'var(--space-xs)' }}>
            <Icon name="code" size={14} />
            Repositorios
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
            {repos.map(repo => {
              const result = results?.[repo];
              const baseBranch = repoBaseBranches[repo] || 'main';
              const isEditing = editingBranchRepo === repo && !done && !creating;
              return (
                <div key={repo} style={{ borderBottom: '1px solid var(--border-light)', padding: '0.5rem 0' }}>
                  <div
                    onClick={() => !done && !creating && !isEditing && toggleRepo(repo)}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      boxSizing: 'border-box',
                      cursor: done || isEditing ? 'default' : 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRepos.has(repo)}
                      onChange={() => {}}
                      disabled={creating || done}
                      style={{ flexShrink: 0, margin: 0, cursor: 'inherit' }}
                    />
                    <span style={{ flex: 1, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{repo}</span>
                    {result && (result.success ? (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--font-xs)', color: 'var(--color-success)', textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <Icon name="check" size={14} />Creado<Icon name="external-link" size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-error)' }} title={result.error}>
                        Error: {result.error}
                      </span>
                    ))}
                  </div>

                  {!done && (
                    <div style={{ paddingLeft: '1.5rem', marginTop: '0.25rem', position: 'relative' }}>
                      {isEditing ? (
                        <>
                          <div className="flex items-center gap-xs">
                            {loadingBranches[repo] ? (
                              <span className="spinner" style={{ width: 12, height: 12 }} />
                            ) : (
                              <input
                                type="text"
                                className="input"
                                style={{ fontSize: 'var(--font-xs)', padding: '0.2rem 0.5rem', height: 'auto', flex: 1 }}
                                placeholder={`Buscar rama destino (actual: ${baseBranch})`}
                                value={branchSearch[repo] ?? ''}
                                onChange={e => setBranchSearch(prev => ({ ...prev, [repo]: e.target.value }))}
                                onClick={e => e.stopPropagation()}
                                autoFocus
                              />
                            )}
                            <button
                              className="btn btn-ghost btn-sm text-xs"
                              onClick={e => { e.stopPropagation(); setEditingBranchRepo(null); setBranchSearch(prev => ({ ...prev, [repo]: undefined })); }}
                            >
                              Cancelar
                            </button>
                          </div>
                          {!loadingBranches[repo] && (() => {
                            const q = (branchSearch[repo] ?? '').toLowerCase();
                            const filtered = (branchOptions[repo] || [baseBranch]).filter(b => b.toLowerCase().includes(q));
                            if (filtered.length === 0) return null;
                            return (
                              <div style={{ position: 'absolute', top: '100%', left: '1.5rem', right: 0, zIndex: 50, background: 'var(--bg-primary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)', maxHeight: 150, overflowY: 'auto', marginTop: 2 }}>
                                {filtered.map(b => (
                                  <div
                                    key={b}
                                    onClick={e => {
                                      e.stopPropagation();
                                      setRepoBaseBranches(prev => ({ ...prev, [repo]: b }));
                                      setEditingBranchRepo(null);
                                      setBranchSearch(prev => ({ ...prev, [repo]: undefined }));
                                    }}
                                    style={{ padding: '0.35rem 0.65rem', fontSize: 'var(--font-xs)', cursor: 'pointer', color: b === baseBranch ? 'var(--color-primary)' : 'var(--text-primary)', fontWeight: b === baseBranch ? 600 : 400, background: 'transparent' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    {b}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm flex items-center gap-xs"
                          style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', padding: '0.1rem 0.25rem' }}
                          onClick={e => {
                            e.stopPropagation();
                            setEditingBranchRepo(repo);
                            fetchBranchesForRepo(repo);
                          }}
                        >
                          <Icon name="git-merge" size={11} />
                          hacia: {baseBranch}
                          <Icon name="edit" size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer flex justify-end gap-sm">
          <button className="btn btn-secondary" onClick={onClose}>{done ? 'Cerrar' : 'Omitir'}</button>
          {!done && (
            <button
              className="btn btn-primary flex items-center gap-xs"
              onClick={handleCreate}
              disabled={creating || !prTitle.trim() || !headBranch.trim() || selectedRepos.size === 0}
            >
              {creating
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creando...</>
                : <><Icon name="git-pull-request" size={16} /> Crear PRs</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePRModal;
