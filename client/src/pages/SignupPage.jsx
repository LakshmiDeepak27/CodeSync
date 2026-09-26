import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, KeyRound, Loader2, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { authService } from '../services/auth.js';
import { AuthDivider, AuthField, AuthFrame } from './LoginPage.jsx';

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const rulesFor = (password) => [
  { label: '8+ characters', pass: password.length >= 8 },
  { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
  { label: 'Lowercase letter', pass: /[a-z]/.test(password) },
  { label: 'Number', pass: /[0-9]/.test(password) }
];

export const SignupPage = () => {
  const { register, verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1); // 1: Enter Details, 2: Verify Gmail OTP
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const urlError = new URLSearchParams(location.search).get('error') || '';
  const [error, setError] = useState(urlError);
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (urlError) {
      setError(urlError);
    }
  }, [urlError]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const rules = rulesFor(form.password);
  const passed = rules.filter((rule) => rule.pass).length;
  const validPassword = passed === rules.length;

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  // STEP 1: Submit Details & Trigger OTP Email
  const submit = async (event) => {
    event.preventDefault();
    if (!validPassword) {
      setError('Use a stronger password that meets all requirements.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setInfoMessage('');
      const res = await register(form);

      // Transition to inline Step 2 OTP verification on the same page
      setStep(2);
      if (res?.devCode) {
        setDevCode(res.devCode);
      }
      setInfoMessage(res?.message || `We sent a 6-digit confirmation code to ${form.email.trim().toLowerCase()}.`);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    const cleanEmail = form.email.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setInfoMessage('');
      await verifyEmail(cleanEmail, cleanCode);
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect') || '/dashboard';
      navigate(redirect);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code or request a new one.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    const cleanEmail = form.email.trim().toLowerCase();
    if (!cleanEmail || resendCooldown > 0 || resending) return;

    try {
      setResending(true);
      setError('');
      setInfoMessage('');
      const res = await resendVerification(cleanEmail);
      if (res?.devCode) {
        setDevCode(res.devCode);
      }
      setInfoMessage(res.message || 'A fresh verification code has been dispatched to your Gmail.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthFrame
      title={step === 2 ? 'Verify your email' : 'Create your account'}
      subtitle={
        step === 2
          ? `We sent a 6-digit verification code to ${form.email}`
          : 'Join real-time collaborative coding rooms with your team.'
      }
    >
      <div className="auth-card auth-card-wide">
        {error && (
          <div className="auth-error flex flex-col gap-1.5 items-start">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('already exists') && (
              <div className="text-xs text-cyan-300 pl-6 flex items-center gap-2">
                <span>Already registered?</span>
                <Link to="/login" className="underline font-semibold hover:text-white">
                  Log In &rarr;
                </Link>
                <span>or</span>
                <Link to="/forgot-password" className="underline font-semibold hover:text-white">
                  Reset Password
                </Link>
              </div>
            )}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 bg-cyan-950/60 border border-cyan-800 rounded-lg text-xs text-cyan-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        {step === 1 ? (
          <>
            <button
              onClick={() => {
                const redirect = new URLSearchParams(location.search).get('redirect') || '';
                window.location.href = authService.getGoogleAuthUrl(redirect);
              }}
              type="button"
              className="auth-google"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <AuthDivider label="or create an account with email" />

            <form onSubmit={submit} className="space-y-4">
              <AuthField label="Full name">
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={update}
                  placeholder="Your name"
                />
              </AuthField>

              <AuthField label="Username">
                <input
                  required
                  name="username"
                  value={form.username}
                  onChange={update}
                  placeholder="developer_handle"
                  autoCapitalize="none"
                />
              </AuthField>

              <AuthField label="Email address">
                <input
                  required
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={update}
                  placeholder="Enter your email address"
                />
              </AuthField>

              <AuthField label="Password">
                <input
                  required
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={update}
                  placeholder="Create a strong password"
                  minLength="8"
                />
                <PasswordStrength rules={rules} passed={passed} visible={Boolean(form.password)} />
              </AuthField>

              <AuthField label="Confirm password">
                <input
                  required
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={update}
                  placeholder="Repeat your password"
                  minLength="8"
                />
                <span className={`auth-match ${form.confirmPassword ? (form.password === form.confirmPassword ? 'is-match' : 'is-mismatch') : ''}`}>
                  {form.confirmPassword && (form.password === form.confirmPassword ? 'Passwords match' : 'Passwords do not match')}
                </span>
              </AuthField>

              <button
                disabled={loading || !validPassword || form.password !== form.confirmPassword}
                className="auth-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create account & Send OTP <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer">
              Already have an account?{' '}
              <Link to={location.search ? `/login${location.search}` : '/login'}>
                Sign in
              </Link>
            </p>
          </>
        ) : (
          /* STEP 2: Inline OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {devCode && (
              <div className="p-3 bg-cyan-950/70 border border-cyan-500/40 rounded-lg text-xs text-cyan-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5 text-cyan-300">
                    <KeyRound className="w-4 h-4 text-cyan-400" /> Cloud Verification OTP
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCode(devCode);
                    }}
                    className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded text-[11px] font-mono font-medium transition cursor-pointer"
                  >
                    Auto-fill Code &rarr;
                  </button>
                </div>
                <p className="text-[11px] text-cyan-300/80 mb-2">
                  (Render Free Tier blocks outbound SMTP mail ports 465/587). Your 6-digit verification code is:
                </p>
                <div className="font-mono text-center tracking-[0.3em] text-xl font-bold text-cyan-300 bg-black/40 py-1.5 rounded border border-cyan-500/30">
                  {devCode}
                </div>
              </div>
            )}

            <div className="p-3 bg-[#08202d] border border-cyan-100/15 rounded-lg">
              <span className="text-xs text-slate-300 block">
                Please check your Gmail inbox (and Spam folder) for the 6-digit verification code sent to <strong className="text-white">{form.email}</strong>.
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
                  onClick={handleResendOtp}
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
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="w-full px-3.5 py-3 bg-[#04151f] border border-cyan-100/20 rounded-lg text-lg font-mono text-center tracking-[0.4em] text-white placeholder-slate-600 focus:outline-none focus:border-[#84dfff] transition"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setInfoMessage('');
                  setStep(1);
                }}
                className="flex-1 py-2.5 px-3 bg-[#092330] hover:bg-[#0d3143] text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Change Details
              </button>
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="flex-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#84dfff] hover:bg-[#a6e8ff] disabled:opacity-50 text-[#062033] rounded-lg text-xs font-bold transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify & Join <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>

            <p className="auth-footer pt-2">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </AuthFrame>
  );
};

const PasswordStrength = ({ rules, passed, visible }) =>
  visible && (
    <div className="password-strength">
      <div className="password-meter" aria-label={`Password strength: ${passed} of ${rules.length} requirements met`}>
        {rules.map((rule) => (
          <i key={rule.label} className={rule.pass ? 'met' : ''} />
        ))}
      </div>
      <div className="password-rules">
        {rules.map((rule) => (
          <span key={rule.label} className={rule.pass ? 'met' : ''}>
            <Check className="h-3 w-3" />
            {rule.label}
          </span>
        ))}
      </div>
    </div>
  );
