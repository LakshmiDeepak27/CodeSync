import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, KeyRound, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { BrandMark } from '../components/BrandMark.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { authService } from '../services/auth.js';

export const VerifyEmailPage = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const email = params.get('email') || user?.email || 'developer@codesync.dev';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  const devCode = '739104';

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await authService.verifyEmail(email, code.trim());
      setVerified(true);
      // Persist verified status
      localStorage.setItem(`codesync-verified-${email}`, 'true');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed. Check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#020d13] px-4 py-10 text-slate-200 surface-grid flex flex-col justify-center items-center font-sans">
      <main className="w-full max-w-md">
        <Link
          to="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#84dfff] transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to workspace
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-white mb-2">
            <BrandMark size={32} />
            <span>CodeSync</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {verified ? 'Account Verified!' : 'Verify Developer Account'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {verified
              ? 'Your developer identity is verified. Full collaborative access unlocked.'
              : `Confirm your email to unlock all features for ${email}`}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-cyan-100/15 bg-[#061923] p-6 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!verified ? (
            <form onSubmit={handleVerify} className="space-y-4">
              {/* Dev Code Callout */}
              <div className="p-3 bg-[#08202d] border border-[#84dfff]/30 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Dev Verification Code</span>
                  <span className="text-sm font-mono font-bold text-[#84dfff] tracking-widest">{devCode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCode(devCode)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#84dfff]/20 text-[#84dfff] hover:bg-[#84dfff] hover:text-[#04151f] rounded transition"
                >
                  Autofill
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#84dfff]" />
                  Enter 6-Digit Code
                </label>
                <input
                  required
                  autoFocus
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 739104"
                  className="w-full px-3.5 py-2.5 bg-[#04151f] border border-cyan-100/15 rounded-lg text-sm font-mono text-center tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-[#84dfff] transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#84dfff] hover:bg-[#a6e8ff] disabled:opacity-50 text-[#062033] rounded-lg text-xs font-bold transition shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Verify Account</span><ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Verified Developer Badge Granted</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Your account is now verified. You can create public or private rooms, invite peers, and run real-time executions.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#84dfff] hover:bg-[#a6e8ff] text-[#062033] rounded-lg text-xs font-bold transition shadow"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
