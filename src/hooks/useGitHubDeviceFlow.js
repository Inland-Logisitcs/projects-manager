import { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export const useGitHubDeviceFlow = ({ onConnected } = {}) => {
  const [token, setToken] = useState(() => localStorage.getItem('github_token') || '');
  const [step, setStep] = useState('idle'); // idle | loading | waiting | error
  const [userCode, setUserCode] = useState('');
  const [verificationUri, setVerificationUri] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const intervalRef = useRef(5);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startPoll = (deviceCode) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const pollFn = httpsCallable(functions, 'github_device_poll');
        const { data } = await pollFn({ device_code: deviceCode });
        if (data.status === 'authorized') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          localStorage.setItem('github_token', data.token);
          setToken(data.token);
          setStep('idle');
          onConnected?.(data.token);
        } else if (data.status === 'slow_down') {
          intervalRef.current += 5;
          clearInterval(pollRef.current);
          startPoll(deviceCode);
        }
        // 'pending' — keep polling
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
      const init = httpsCallable(functions, 'github_device_init');
      const { data } = await init({});
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
    localStorage.setItem('github_token', pat);
    setToken(pat);
    onConnected?.(pat);
  };

  return { token, step, userCode, verificationUri, error, connect, disconnect, cancel, savePatToken };
};
