import { useState } from 'react';
import Icon from '../common/Icon';
import { getDefaultBranchSha, createGithubBranch } from '../../services/githubService';
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

const CreateBranchModal = ({ task, project, onClose }) => {
  const repos = project.repositories || [];
  const [branchName, setBranchName] = useState(`feature/${slugify(task.title)}`);
  const [selectedRepos, setSelectedRepos] = useState(() => new Set(repos));
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState(null);
  const [showPatInput, setShowPatInput] = useState(false);
  const [patValue, setPatValue] = useState('');

  const { token, step, userCode, verificationUri, error, connect, disconnect, cancel, savePatToken } = useGitHubDeviceFlow();

  const copyCode = () => navigator.clipboard.writeText(userCode).catch(() => {});

  const toggleRepo = (repo) => {
    setSelectedRepos(prev => {
      const next = new Set(prev);
      if (next.has(repo)) next.delete(repo); else next.add(repo);
      return next;
    });
  };

  const handleCreate = async () => {
    const trimmedBranch = branchName.trim();
    if (!token || !trimmedBranch) return;
    setCreating(true);
    const newResults = {};
    for (const repoFull of repos) {
      if (!selectedRepos.has(repoFull)) continue;
      const [owner, repo] = repoFull.split('/');
      try {
        const { sha } = await getDefaultBranchSha(token, owner, repo);
        await createGithubBranch(token, owner, repo, trimmedBranch, sha);
        newResults[repoFull] = {
          success: true,
          url: `https://github.com/${owner}/${repo}/tree/${encodeURIComponent(trimmedBranch)}`
        };
      } catch (err) {
        newResults[repoFull] = { success: false, error: err.message };
      }
    }
    setResults(newResults);
    setCreating(false);
  };

  const done = results !== null;

  const renderConnectSection = () => {
    if (step === 'loading') return (
      <div className="flex flex-col items-center gap-base p-md text-center">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p className="text-sm text-secondary">Iniciando autenticacion...</p>
      </div>
    );

    if (step === 'waiting') return (
      <div className="flex flex-col items-center gap-base p-md text-center">
        <p className="text-sm text-secondary">Ingresa este codigo en GitHub:</p>
        <div className="flex items-center gap-sm p-sm" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-base)', border: '1px solid var(--border-medium)' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-primary)' }}>
            {userCode}
          </span>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={copyCode} title="Copiar">
            <Icon name="save" size={16} />
          </button>
        </div>
        <a href={verificationUri} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex items-center gap-xs">
          <Icon name="external-link" size={16} />
          Abrir GitHub para autorizar
        </a>
        <p className="text-xs text-tertiary flex items-center gap-xs">
          <span className="spinner" style={{ width: 12, height: 12 }} />
          Esperando autorizacion...
        </p>
        <button className="btn btn-ghost text-xs text-tertiary" onClick={cancel}>Cancelar</button>
      </div>
    );

    if (step === 'error') return (
      <div className="flex flex-col items-center gap-base p-md text-center">
        <Icon name="alert-circle" size={32} />
        <p className="text-sm text-secondary">{error}</p>
        <button className="btn btn-primary btn-sm" onClick={() => connect()}>Intentar de nuevo</button>
      </div>
    );

    if (showPatInput) return (
      <div className="flex flex-col gap-sm">
        <div className="form-group">
          <label className="label flex items-center gap-xs">
            <Icon name="key" size={14} />
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            className="input"
            placeholder="ghp_..."
            value={patValue}
            onChange={e => setPatValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && savePatToken(patValue.trim())}
            autoFocus
          />
        </div>
        <div className="flex gap-xs justify-end">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPatInput(false)}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => savePatToken(patValue.trim())} disabled={!patValue.trim()}>Guardar</button>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col items-center gap-base p-md text-center">
        <Icon name="git-branch" size={40} />
        <p className="text-sm text-secondary">Conecta tu cuenta de GitHub para crear ramas automaticamente</p>
        <button className="btn btn-primary flex items-center gap-xs" onClick={connect}>
          <Icon name="git-branch" size={16} />
          Conectar con GitHub
        </button>
        <button className="btn btn-ghost text-xs text-tertiary" onClick={() => setShowPatInput(true)}>
          o usar token personal (PAT)
        </button>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={done ? onClose : undefined}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-base">
          <h3 className="heading-3 text-primary flex items-center gap-sm" style={{ margin: 0 }}>
            <Icon name="git-branch" size={20} />
            Crear ramas en GitHub
          </h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <p className="text-sm text-secondary mb-base">
          Tarea: <strong className="text-primary">{task.title}</strong>
        </p>

        {!token ? renderConnectSection() : (
          <>
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
                <Icon name="git-branch" size={14} />
                Nombre de la rama
              </label>
              <input type="text" className="input" value={branchName} onChange={e => setBranchName(e.target.value)} disabled={creating || done} />
            </div>
            <div className="form-group">
              <label className="label flex items-center gap-xs">
                <Icon name="code" size={14} />
                Repositorios
              </label>
              <div className="flex flex-col gap-xs">
                {repos.map(repo => {
                  const result = results?.[repo];
                  return (
                    <label key={repo} className="flex items-center gap-sm p-sm border-b-light" style={{ cursor: done ? 'default' : 'pointer', borderRadius: 'var(--radius-sm)' }}>
                      <input type="checkbox" checked={selectedRepos.has(repo)} onChange={() => toggleRepo(repo)} disabled={creating || done} />
                      <span className="text-sm text-primary" style={{ flex: 1 }}>{repo}</span>
                      {result && (result.success ? (
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-xs text-xs" style={{ color: 'var(--color-success)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                          <Icon name="check" size={14} />Creada<Icon name="external-link" size={12} />
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-error)' }} title={result.error}>Error: {result.error}</span>
                      ))}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer flex justify-end gap-sm">
              <button className="btn btn-secondary" onClick={onClose}>{done ? 'Cerrar' : 'Omitir'}</button>
              {!done && (
                <button className="btn btn-primary flex items-center gap-xs" onClick={handleCreate} disabled={creating || !branchName.trim() || selectedRepos.size === 0}>
                  {creating ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creando...</> : <><Icon name="git-branch" size={16} /> Crear ramas</>}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateBranchModal;
