import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

export const redirectToGitHubOAuth = (returnPath) => {
  const state = encodeURIComponent(returnPath || window.location.pathname);
  const redirectUri = encodeURIComponent(`${window.location.origin}/github-callback`);
  window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${state}&redirect_uri=${redirectUri}`;
};

export const useGitHubDeviceFlow = ({ onConnected } = {}) => {
  const [token, setToken] = useState(() => localStorage.getItem('github_token') || '');

  const saveToken = async (tok) => {
    localStorage.setItem('github_token', tok);
    setToken(tok);
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await updateDoc(doc(db, 'users', uid), { githubToken: tok });
      } catch {
        // Firestore save is best-effort
      }
    }
    onConnected?.(tok);
  };

  const connect = () => {
    redirectToGitHubOAuth(window.location.pathname);
  };

  const disconnect = () => {
    localStorage.removeItem('github_token');
    setToken('');
  };

  const cancel = () => {};

  const savePatToken = (pat) => {
    saveToken(pat);
  };

  // step/userCode/verificationUri/error kept for API compatibility with components
  return {
    token,
    step: 'idle',
    userCode: '',
    verificationUri: '',
    error: '',
    connect,
    disconnect,
    cancel,
    savePatToken,
  };
};
