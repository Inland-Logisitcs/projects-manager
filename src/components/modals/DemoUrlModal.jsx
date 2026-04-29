import { useState, useEffect } from 'react';
import Icon from '../common/Icon';
import { createGithubPR, listRepoBranches } from '../../services/githubService';
import { useGitHubDeviceFlow } from '../../hooks/useGitHubDeviceFlow';
import { updateTask } from '../../services/taskService';

const DemoUrlModal = ({ isOpen, onConfirm, onCancel, task, project }) => {
  const [demoUrl, setDemoUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const repos = project?.repositories || [];
  const [selectedRepos, setSelectedRepos] = useState(() => new Set(repos));
  const [repoBaseBranches, setRepoBaseBranches] = useState(() => ({ ...(project?.repoBranches || {}) }));
  const [branchOptions, setBranchOptions] = useState({});
  const [loadingBranches, setLoadingBranches] = useState({});
  const [editingBranchRepo, setEditingBranchRepo] = useState(null);
  const [branchSearch, setBranchSearch] = useState({});
  const [prResults, setPrResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedUrl, setConfirmedUrl] = useState(null);

  const { token } = useGitHubDeviceFlow();
  const showPrSection = repos.length > 0 && !!token;

  useEffect(() => {
    if (isOpen) {
      setSelectedRepos(new Set(project?.repositories || []));
      setRepoBaseBranches({ ...(project?.repoBranches || {}) });
      setBranchOptions({});
      setPrResults(null);
      setConfirmedUrl(null);
      setDemoUrl('');
      setUrlError('');
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const validateUrl = (url) => {
    try { new URL(url); return true; } catch { return false; }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = demoUrl.trim();
    if (!trimmed) { setUrlError('El link de demo es requerido.'); return; }
    if (!validateUrl(trimmed)) { setUrlError('Ingresa una URL valida (ej: https://ejemplo.com)'); return; }
    setUrlError('');
    setSubmitting(true);

    let collectedResults = null;

    if (showPrSection && selectedRepos.size > 0 && task?.featureBranch) {
      const newResults = {};
      for (const repoFull of repos) {
        if (!selectedRepos.has(repoFull)) continue;
        const [owner, repo] = repoFull.split('/');
        const base = repoBaseBranches[repoFull] || 'main';
        try {
          const pr = await createGithubPR(token, owner, repo, { title: task.title, head: task.featureBranch, base });
          newResults[repoFull] = { success: true, url: pr.html_url, number: pr.number };
        } catch (err) {
          newResults[repoFull] = { success: false, error: err.message };
        }
      }
      collectedResults = newResults;
      setPrResults(newResults);
      const newPRs = Object.entries(newResults)
        .filter(([, r]) => r.success)
        .map(([repo, r]) => ({ repo, number: r.number, url: r.url, state: 'open' }));
      if (newPRs.length > 0) {
        const existing = task.pullRequests || [];
        const merged = [...existing.filter(p => !newPRs.find(n => n.repo === p.repo)), ...newPRs];
        updateTask(task.id, { pullRequests: merged }).catch(() => {});
      }
    }

    setSubmitting(false);

    const hasErrors = collectedResults && Object.values(collectedResults).some(r => !r.success);
    if (hasErrors) {
      setConfirmedUrl(trimmed);
    } else {
      onConfirm(trimmed);
      setDemoUrl('');
      setPrResults(null);
    }
  };

  const handleDone = () => {
    onConfirm(confirmedUrl);
    setDemoUrl('');
    setPrResults(null);
    setConfirmedUrl(null);
  };

  const handleCancel = () => {
    setDemoUrl('');
    setUrlError('');
    setPrResults(null);
    onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="flex items-center justify-between mb-base">
          <h3 className="modal-header flex items-center gap-sm" style={{ margin: 0 }}>
            <Icon name="link" size={20} />
            Enviar a QA
          </h3>
          <button className="btn btn-icon btn-ghost" onClick={handleCancel}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {task && (
          <p className="text-sm text-secondary mb-base">
            Tarea: <strong className="text-primary">{task.title}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-base">
          <div className="form-group">
            <label className="label">URL de Demo *</label>
            <input
              type="text"
              className="input"
              value={demoUrl}
              onChange={e => { setDemoUrl(e.target.value); if (urlError) setUrlError(''); }}
              placeholder="https://demo.ejemplo.com/feature"
              autoFocus
            />
            {urlError && <span className="text-sm" style={{ color: 'var(--color-error)' }}>{urlError}</span>}
          </div>

          {showPrSection && (
            <div>
              <div className="label flex items-center gap-xs" style={{ marginBottom: 'var(--space-xs)' }}>
                <Icon name="git-pull-request" size={14} />
                Pull Requests
                {!task?.featureBranch && (
                  <span className="text-xs text-tertiary">(sin rama guardada — crea las ramas primero)</span>
                )}
              </div>

              {task?.featureBranch && (
                <div className="flex items-center gap-xs mb-xs" style={{ paddingLeft: '0.25rem' }}>
                  <Icon name="git-branch" size={12} />
                  <span className="text-xs text-secondary" style={{ fontFamily: 'monospace' }}>{task.featureBranch}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', opacity: task?.featureBranch ? 1 : 0.4, pointerEvents: task?.featureBranch ? 'auto' : 'none' }}>
                {repos.map(repo => {
                  const baseBranch = repoBaseBranches[repo] || 'main';
                  const isEditing = editingBranchRepo === repo;
                  const result = prResults?.[repo];
                  return (
                    <div key={repo} style={{ borderBottom: '1px solid var(--border-light)', padding: '0.4rem 0' }}>
                      <div
                        onClick={() => !submitting && toggleRepo(repo)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRepos.has(repo)}
                          onChange={() => {}}
                          disabled={submitting}
                          style={{ flexShrink: 0, margin: 0, cursor: 'inherit' }}
                        />
                        <span style={{ flex: 1, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{repo}</span>
                        {result && (result.success ? (
                          <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--font-xs)', color: 'var(--color-success)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                            <Icon name="check" size={14} />PR<Icon name="external-link" size={12} />
                          </a>
                        ) : (
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-error)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={result.error}>{result.error}</span>
                        ))}
                      </div>

                      <div style={{ paddingLeft: '1.5rem', marginTop: '0.2rem', position: 'relative' }}>
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
                                type="button"
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
                                <div style={{ position: 'absolute', top: '100%', left: '1.5rem', right: 0, zIndex: 50, background: 'var(--bg-primary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)', maxHeight: 140, overflowY: 'auto', marginTop: 2 }}>
                                  {filtered.map(b => (
                                    <div
                                      key={b}
                                      onClick={e => { e.stopPropagation(); setRepoBaseBranches(prev => ({ ...prev, [repo]: b })); setEditingBranchRepo(null); setBranchSearch(prev => ({ ...prev, [repo]: undefined })); }}
                                      style={{ padding: '0.35rem 0.65rem', fontSize: 'var(--font-xs)', cursor: 'pointer', color: b === baseBranch ? 'var(--color-primary)' : 'var(--text-primary)', fontWeight: b === baseBranch ? 600 : 400 }}
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
                            type="button"
                            className="btn btn-ghost btn-sm flex items-center gap-xs"
                            style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', padding: '0.1rem 0.25rem' }}
                            onClick={e => { e.stopPropagation(); setEditingBranchRepo(repo); fetchBranchesForRepo(repo); }}
                          >
                            <Icon name="git-merge" size={11} />
                            hacia: {baseBranch}
                            <Icon name="edit" size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="modal-footer flex justify-end gap-sm">
            <button type="button" onClick={confirmedUrl ? handleDone : handleCancel} className="btn btn-secondary">
              {confirmedUrl ? 'Cerrar' : 'Cancelar'}
            </button>
            {!confirmedUrl && (
              <button type="submit" className="btn btn-primary flex items-center gap-xs" disabled={submitting}>
                {submitting
                  ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Enviando...</>
                  : <><Icon name="check-circle" size={16} /> Enviar a QA</>
                }
              </button>
            )}
            {confirmedUrl && (
              <button type="button" className="btn btn-primary flex items-center gap-xs" onClick={handleDone}>
                <Icon name="check-circle" size={16} /> Continuar de todas formas
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemoUrlModal;
