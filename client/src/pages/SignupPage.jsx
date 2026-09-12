import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { Code2, ArrowRight, Loader2, AlertCircle, Check } from 'lucide-react';
import { authService } from '../services/auth.js';

export const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 10) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return Math.min(strength, 4);
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-dark-950 text-dark-200">
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-3 group">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-dark-100 tracking-tight">CodeSync</span>
        </Link>
        <h1 className="text-xl font-bold text-dark-100">Create your account</h1>
        <p className="text-xs text-dark-400 mt-1">Join thousands of developers collaborating in real time</p>
      </div>

      <div className="w-full max-w-sm bg-dark-900 border border-dark-750 rounded-xl shadow-2xl p-6">
        {error && (
          <div className="mb-4 p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-lg text-xs text-accent-rose flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center space-x-2.5 px-4 py-2.5 bg-dark-800 hover:bg-dark-750 border border-dark-700 hover:border-dark-650 rounded-lg text-xs font-semibold text-dark-100 transition shadow-sm mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-dark-750 w-full"></div>
          <span className="bg-dark-900 px-2 text-[11px] font-semibold text-dark-500 uppercase tracking-wider relative">
            Or register with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Deepak Kumar"
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="deepak_dev"
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
              Email address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="deepak@example.com"
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
            />

            {/* Password strength meter */}
            {formData.password && (
              <div className="mt-1.5 flex items-center space-x-1">
                <div className={`h-1 flex-1 rounded-full ${strength >= 1 ? 'bg-accent-rose' : 'bg-dark-700'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${strength >= 2 ? 'bg-accent-amber' : 'bg-dark-700'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${strength >= 3 ? 'bg-brand-400' : 'bg-dark-700'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${strength >= 4 ? 'bg-accent-emerald' : 'bg-dark-700'}`}></div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-dark-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
