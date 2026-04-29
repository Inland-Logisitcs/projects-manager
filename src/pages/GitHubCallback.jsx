import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc } from 'firebase/firestore';
import { functions, db, auth } from '../config/firebase';
import Icon from '../components/common/Icon';

const GitHubCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg('Acceso denegado en GitHub');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('No se recibio el codigo de autenticacion');
      return;
    }

    const exchange = async () => {
      try {
        const githubOAuth = httpsCallable(functions, 'github_oauth');
        const result = await githubOAuth({ code });

        if (result.data?.token) {
          const tok = result.data.token;
          localStorage.setItem('github_token', tok);
          const uid = auth.currentUser?.uid;
          if (uid) {
            updateDoc(doc(db, 'users', uid), { githubToken: tok }).catch(() => {});
          }
        }

        setStatus('success');
        const redirectTo = state ? decodeURIComponent(state) : '/dashboard';
        setTimeout(() => navigate(redirectTo, { replace: true }), 1500);
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message || 'Error al conectar con GitHub');
      }
    };

    exchange();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4xl text-center" style={{ minHeight: '50vh' }}>
      {status === 'loading' && (
        <>
          <div className="spinner" style={{ width: 48, height: 48 }} />
          <p className="text-base text-secondary mt-base">Conectando con GitHub...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <Icon name="check-circle" size={48} />
          <h2 className="heading-2 text-primary mt-base">GitHub conectado</h2>
          <p className="text-base text-secondary">Redirigiendo...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <Icon name="alert-circle" size={48} />
          <h2 className="heading-2 text-primary mt-base">Error de autenticacion</h2>
          <p className="text-base text-secondary mb-base">{errorMsg}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Volver al inicio
          </button>
        </>
      )}
    </div>
  );
};

export default GitHubCallback;
