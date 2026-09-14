import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { BrandMark } from '../components/BrandMark.jsx';
import { authService } from '../services/auth.js';

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(new URLSearchParams(location.search).get('error') || '');
  const [needsVerification, setNeedsVerification] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      setNeedsVerification(false);
      await login({ email, password });
      const redirect = new URLSearchParams(location.search).get('redirect') || '/dashboard';
      navigate(redirect);
    } catch (err) {
      const errMsg = err.message || 'Invalid email or password';
      setError(errMsg);
      if (errMsg.toLowerCase().includes('verify') || errMsg.toLowerCase().includes('verification')) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to continue working with your team.">
      <div className="auth-card">
        {error && (
          <div className="auth-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div className="flex-1">
              <span>{error}</span>
              {needsVerification && (
                <div className="mt-2">
                  <Link
                    to={`/verify-email?email=${encodeURIComponent(email)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#84dfff] underline hover:text-white"
                  >
                    <MailCheck className="h-3.5 w-3.5" /> Enter verification code now &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => {
            window.location.href = authService.getGoogleAuthUrl();
          }}
          type="button"
          className="auth-google"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <AuthDivider label="or continue with email" />

        <form onSubmit={submit} className="space-y-4">
          <AuthField label="Email address">
            <input
              required
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
            />
          </AuthField>

          <AuthField label="Password" action={<Link to="/forgot-password">Forgot password?</Link>}>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </AuthField>

          <button disabled={loading || !email || !password} className="auth-primary">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign in <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          New to CodeSync?{' '}
          <Link to={location.search ? `/signup${location.search}` : '/signup'}>
            Create an account
          </Link>
        </p>
      </div>
    </AuthFrame>
  );
};

export const AuthFrame = ({ title, subtitle, children }) => (
  <div className="auth-page">
    <main className="auth-shell">
      <header className="auth-intro">
        <Link to="/" className="auth-brand">
          <BrandMark size={42} /> <span>CodeSync</span>
        </Link>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>
      {children}
    </main>
  </div>
);

export const AuthDivider = ({ label }) => (
  <div className="auth-divider">
    <span>{label}</span>
  </div>
);

export const AuthField = ({ label, action, children }) => (
  <label className="auth-field">
    <span>
      <b>{label}</b>
      {action && <em>{action}</em>}
    </span>
    {children}
  </label>
);
