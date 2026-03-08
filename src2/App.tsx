import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppDispatch } from './hooks/hooks';
import { setCredentials, clearCredentials } from './features/auth/slices/authSlice';
import axios from 'axios';
import './App.css';

function App() {
  const dispatch = useAppDispatch();
  const [authReady, setAuthReady] = useState(false);
  const didVerify = useRef(false);

  useEffect(() => {
    if (didVerify.current) return;
    didVerify.current = true;

    axios
      .get('http://localhost:8000/api/v1/auth/verify', { withCredentials: true })
      .then((res) => {
        if (res.data.valid) {
          dispatch(setCredentials({ token: res.data.access_token, user: res.data.user }));
        } else {
          dispatch(clearCredentials());
        }
      })
      .catch(() => {
        dispatch(clearCredentials());
      })
      .finally(() => {
        setAuthReady(true);
      });
  }, []);

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return <Outlet />;
}

export default App;