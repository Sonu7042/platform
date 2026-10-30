import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { bootstrapAuthThunk } from '../features/auth/authSlice';

export function ProtectedRoute() {
  const dispatch = useDispatch();
  const { token, user, bootstrapped } = useSelector((state) => state.auth);
  const [checking, setChecking] = useState(!!token && !user);

  useEffect(() => {
    if (token && !user) {
      dispatch(bootstrapAuthThunk()).finally(() => setChecking(false));
    }
  }, [dispatch, token, user]);

  if (!token) return <Navigate to="/login" replace />;
  if (checking && !bootstrapped) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Loading your workspace...
      </div>
    );
  }

  return <Outlet />;
}
