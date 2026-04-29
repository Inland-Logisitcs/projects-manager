import { useState, useRef, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

const githubPost = async (url, params) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(params).toString()
  });
  return res.json();
};

export const useGitHubDeviceFlow = ({ onConnected } = {}) => {
  const [token, setToken] = useState(() => localStorage.getItem('github_token') || '');
  const [step, setStep] = useState('idle'); // idle | loading | waiting | error
  const [userCode, setUserCode] = useState('');
  const [verificationUri, setVerificationUri] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const intervalRef = useRef(5);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const saveToken = async (tok) => {
    localStorage.setItem('github_token', tok);
    setToken(tok);
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await updateDoc(doc(db, 'users', uid), { githubToken: tok });
      } catch {
        // Firestore save is best-effort; localStorage is the primary store
      }
    }
    onConnected?.(tok);
  };

  const startPoll = (deviceCode) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const data = await githubPost('https://github.com/login/oauth/access_token', {
          client_id: GITHUB_CLIENT_ID,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        });

        if (data.access_token) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStep('idle');
          await saveToken(data.access_token);
        } else if (data.error === 'slow_down') {
          intervalRef.current += 5;
          clearInterval(pollRef.current);
          startPoll(deviceCode);
        } else if (data.error === 'expired_token') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setError('El codigo expiro. Intentalo de nuevo.');
          setStep('error');
        } else if (data.error === 'access_denied') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setError('Acceso denegado en GitHub.');
          setStep('error');
        }
        // authorization_pending — keep polling
      } catch (err) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setError(err.message || 'Error al verificar autorizacion');
        setStep('error');
      }
    }, intervalRef.current * 1000);
  };

  const connect = async () => {
    setStep('loading');
    setError('');
    try {
      const data = await githubPost('https://github.com/login/device/code', {
        client_id: GITHUB_CLIENT_ID,
        scope: 'repo'
      });

      if (!data.device_code) {
        throw new Error(data.error_description || data.error || 'Respuesta inesperada de GitHub');
      }

      setUserCode(data.user_code);
      setVerificationUri(data.verification_uri);
      intervalRef.current = data.interval || 5;
      setStep('waiting');
      startPoll(data.device_code);
    } catch (err) {
      setError(err.message || 'Error al iniciar autenticacion');
      setStep('error');
    }
  };

  const disconnect = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    localStorage.removeItem('github_token');
    setToken('');
    setStep('idle');
  };

  const cancel = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setStep('idle');
  };

  const savePatToken = (pat) => {
    saveToken(pat);
  };

  return { token, step, userCode, verificationUri, error, connect, disconnect, cancel, savePatToken };
};
