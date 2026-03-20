import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { AuthScreen } from './AuthScreen';

function Spinner() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function AuthGate() {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { isLoading: profileLoading } = useProfile();

  if (authLoading) return <Spinner />;
  if (!user) return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
  if (profileLoading) return <Spinner />;

  return <Outlet />;
}
