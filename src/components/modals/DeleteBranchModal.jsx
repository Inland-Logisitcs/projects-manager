import { useState } from 'react';
import Icon from '../common/Icon';
import { deleteGithubBranch } from '../../services/githubService';
import { updateTask } from '../../services/taskService';
import { useGitHubDeviceFlow } from '../../hooks/useGitHubDeviceFlow';

const DeleteBranchModal = ({ task, onClose, onSkip }) => {
  const repos = task.featureBranchRepos || [];
  const branchName = task.featureBranch;
  const [selectedRepos, setSelectedRepos] = useState(() => new Set(repos));
  const [deleting, setDeleting] = useState(false);
  const [results, setResults] = useState(null);

  const { token } = useGitHubDeviceFlow();

  const toggleRepo = (repo) => {
    setSelectedRepos(prev => {
      const next = new Set(prev);
      if (next.has(repo)) next.delete(repo); else next.add(repo);
      return next;
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    const newResults = {};

    for (const repoFull of repos) {
      if (!selectedRepos.has(repoFull)) continue;
      const [owner, repo] = repoFull.split('/');
      try {
        await deleteGithubBranch(token, owner, repo, branchName);
        newResults[repoFull] = { success: true };
      } catch (err) {
        newResults[repoFull] = { success: false, error: err.message };
      }
    }

    setResults(newResults);
    setDeleting(false);

    const deletedRepos = Object.entries(newResults).filter(([, r]) => r.success).map(([repo]) => repo);
    const remaining = repos.filter(r => !deletedRepos.includes(r));
    await updateTask(task.id, {
      featureBranch: remaining.length > 0 ? branchName : null,
      featureBranchRepos: remaining.length > 0 ? remaining : null,
    }).catch(() => {});
  };

  const done = results !== null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-base">
          <h3 className="heading-3 text-primary flex items-center gap-sm" style={{ margin: 0 }}>
            <Icon name="git-branch" size={20} />
            Eliminar ramas
          </h3>
          <button className="btn btn-icon btn-ghost" onClick={done ? onClose : onSkip}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <p className="text-sm text-secondary mb-base">
          Rama: <strong className="text-primary" style={{ fontFamily: 'monospace' }}>{branchName}</strong>
        </p>

        {!token ? (
          <p className="text-sm text-secondary">No hay sesion de GitHub activa. Las ramas no se eliminaran de GitHub pero se limpiara la referencia en la tarea.</p>
        ) : (
          <div style={{ marginBottom: 'var(--space-base)' }}>
            <div className="label flex items-center gap-xs" style={{ marginBottom: 'var(--space-xs)' }}>
              <Icon name="code" size={14} />
              Repositorios
            </div>
            {repos.length === 0 ? (
              <p className="text-sm text-tertiary">No hay repos registrados. Se limpiara solo la referencia en la tarea.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {repos.map(repo => {
                  const result = results?.[repo];
                  return (
                    <div
                      key={repo}
                      onClick={() => !done && !deleting && toggleRepo(repo)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem', borderBottom: '1px solid var(--border-light)',
                        cursor: done ? 'default' : 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRepos.has(repo)}
                        onChange={() => {}}
                        disabled={deleting || done}
                        style={{ flexShrink: 0, margin: 0, cursor: 'inherit' }}
                      />
                      <span style={{ flex: 1, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{repo}</span>
                      {result && (result.success ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--font-xs)', color: 'var(--color-success)' }}>
                          <Icon name="check" size={14} />Eliminada
                        </span>
                      ) : (
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-error)' }} title={result.error}>
                          Error: {result.error}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="modal-footer flex justify-end gap-sm">
          <button className="btn btn-secondary" onClick={done ? onClose : onSkip}>
            {done ? 'Cerrar' : 'Omitir'}
          </button>
          {!done && (
            <button
              className="btn btn-danger flex items-center gap-xs"
              onClick={handleDelete}
              disabled={deleting || (repos.length > 0 && selectedRepos.size === 0)}
            >
              {deleting
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Eliminando...</>
                : <><Icon name="trash-2" size={16} /> Eliminar ramas</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteBranchModal;
