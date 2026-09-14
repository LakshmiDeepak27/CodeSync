import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShieldCheck, KeyRound, Loader2, AlertCircle, ArrowLeft, Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { BrandMark } from '../components/BrandMark.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { authService } from '../services/auth.js';

export const VerifyEmailPage = () => {
  const { verifyEmail, resendVerification } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const emailParam = params.get('email') || '';
  const codeParam = params.get('code') || '';
  const redirectParam = params.get('redirect') || '/dashboard';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(codeParam);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-verify if code and email are both present in URL
  useEffect(() => {
    if (emailParam && codeParam && codeParam.length === 6 && !verified && !loading) {
      executeVerify(emailParam, codeParam);
    }
  }, [emailParam, codeParam]);

  const executeVerify = async (targetEmail, targetCode) => {
    if (!targetEmail.trim()) {
      setError('Please provide your registered email address.');
      return;
    }
    if (!targetCode.trim()) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setInfoMessage('');
      const res = await verifyEmail(targetEmail.trim(), targetCode.trim());
      setVerified(true);
      // Clean query params so refresh doesn't re-trigger
      window.history.replaceState({}, document.title, window.location.pathname);
      // Auto redirect after 2 seconds
      setTimeout(() => {
        navigate(redirectParam);
      }, 1800);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code or request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    executeVerify(email, code);
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to receive a new code.');
      return;
    }
    if (resendCooldown > 0 || resending) return;

    try {
      setResending(true);
      setError('');
      setInfoMessage('');
      const res = await resendVerification(email.trim());
      setInfoMessage(res.message || 'A fresh verification code has been sent to your Gmail.');
      setResendCooldown(60); // 60s cooldown
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#020d13] px-4 py-10 text-slate-200 surface-grid flex flex-col justify-center items-center font-sans">
      <main className="w-full max-w-md">
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#84dfff] transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-white mb-2">
            <BrandMark size={32} />
            <span>CodeSync</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {verified ? 'Email Verified!' : 'Verify Your Email'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {verified
              ? 'Your email is verified. Redirecting you to your workspace...'
              : email
              ? `We sent a 6-digit confirmation code to ${email}`
              : 'Enter your registered email and the 6-digit verification code.'}
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

          {infoMessage && (
            <div className="mb-4 p-3 bg-cyan-950/60 border border-cyan-800 rounded-lg text-xs text-cyan-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <span>{infoMessage}</span>
            </div>
          )}

          {!verified ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#84dfff]" />
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-[#04151f] border border-cyan-100/15 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#84dfff] transition"
                />
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
                  placeholder="e.g. 849201"
                  className="w-full px-3.5 py-2.5 bg-[#04151f] border border-cyan-100/15 rounded-lg text-lg font-mono text-center tracking-widest text-[#84dfff] placeholder-slate-600 focus:outline-none focus:border-[#84dfff] transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !code.trim() || code.length < 6 || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#84dfff] hover:bg-[#a6e8ff] disabled:opacity-50 text-[#062033] rounded-lg text-xs font-bold transition shadow-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0 || !email.trim()}
                  className="inline-flex items-center gap-1 font-semibold text-[#84dfff] hover:text-[#a6e8ff] disabled:opacity-40 transition"
                >
                  {resending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Verification codes expire in 15 minutes. Check your inbox and spam folder.
              </p>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Email Verified Successfully</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Your identity is confirmed. Full collaborative IDE features and real-time execution unlocked.
                </p>
              </div>
              <button
                onClick={() => navigate(redirectParam)}
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
