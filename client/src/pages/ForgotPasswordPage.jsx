import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, Lock, KeyRound, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { BrandMark } from '../components/BrandMark.jsx';
import { authService } from '../services/auth.js';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer for Resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Step 1: Request Reset Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    try {
      setLoading(true);
      setError('');
      setInfoMessage('');
      const res = await authService.requestPasswordReset(cleanEmail);
      setInfoMessage(res.message || `A 6-digit verification code has been sent to ${cleanEmail}`);
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No account found with this email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend Code
  const handleResendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || resendCooldown > 0 || resending) return;

    try {
      setResending(true);
      setError('');
      setInfoMessage('');
      const res = await authService.requestPasswordReset(cleanEmail);
      setInfoMessage(res.message || 'A fresh verification code has been dispatched to your email.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Submit New Password with Code
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setInfoMessage('');
      await authService.resetPassword(cleanEmail, cleanCode, newPassword);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#020d13] px-4 py-10 text-slate-200 surface-grid flex flex-col justify-center items-center">
      <main className="w-full max-w-md">
        {/* Back Link */}
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#84dfff] transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-white mb-2">
            <BrandMark size={32} />
            <span>CodeSync</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {step === 3 ? 'Password Updated!' : 'Reset your password'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {step === 1 && 'Enter your account email to receive a secure password reset code.'}
            {step === 2 && `Enter the 6-digit verification code sent to ${email}`}
            {step === 3 && 'Your password has been changed. You can now log into your workspaces.'}
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

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#84dfff]" />
                  Registered Email Address
                </label>
                <input
                  required
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-[#04151f] border border-cyan-100/15 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#84dfff] transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#84dfff] hover:bg-[#a6e8ff] disabled:opacity-50 text-[#062033] rounded-lg text-xs font-bold transition shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Send Verification Code</span><ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </form>
          )}

          {/* STEP 2: Enter Code & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-[#08202d] border border-cyan-100/15 rounded-lg">
                <span className="text-[11px] text-slate-300 block">
                  Check your Gmail inbox (and Spam folder) for the 6-digit confirmation code sent to <strong className="text-white">{email}</strong>.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#84dfff]" />
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || resending}
                    className="text-[11px] text-[#84dfff] hover:underline disabled:text-slate-500 disabled:no-underline flex items-center gap-1 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
                <input
                  required
                  autoFocus
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 bg-[#04151f] border border-cyan-100/15 rounded-lg text-sm font-mono text-center tracking-[0.3em] text-white placeholder-slate-600 focus:outline-none focus:border-[#84dfff] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#84dfff]" />
                  New Password (at least 8 characters)
                </label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password"
                  className="w-full px-3.5 py-2 bg-[#04151f] border border-cyan-100/15 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#84dfff] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#84dfff]" />
                  Confirm New Password
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2 bg-[#04151f] border border-cyan-100/15 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#84dfff] transition"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setInfoMessage('');
                    setStep(1);
                  }}
                  className="flex-1 py-2.5 px-3 bg-[#092330] hover:bg-[#0d3143] text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Change Email
                </button>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6 || newPassword.length < 8}
                  className="flex-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#84dfff] hover:bg-[#a6e8ff] disabled:opacity-50 text-[#062033] rounded-lg text-xs font-bold transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Password Changed Successfully!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Your credentials have been securely updated. You can now sign in with your new password.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#84dfff] hover:bg-[#a6e8ff] text-[#062033] rounded-lg text-xs font-bold transition shadow"
              >
                <span>Sign in to your account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
