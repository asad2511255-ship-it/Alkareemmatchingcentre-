import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Send,
  RefreshCw,
} from 'lucide-react';
import { api } from '../utils/api.ts';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string) => void;
}

type AuthView = 'login' | 'register' | 'forgot_request' | 'forgot_verify';

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [view, setView] = useState<AuthView>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [generatedDevCode, setGeneratedDevCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);

  const checkAuthStatus = async () => {
    setCheckingStatus(true);
    setError(null);
    setSuccessNotice(null);
    try {
      const status = await api.getAuthStatus();
      setIsRegistered(status.isRegistered);
      setRegisteredEmail(status.email);

      if (status.isAuthenticated) {
        onAuthSuccess(localStorage.getItem('alkareem_owner_token') || '');
        onClose();
        return;
      }

      // If no owner is registered yet, automatically show ONE-TIME REGISTRATION
      if (!status.isRegistered) {
        setView('register');
      } else {
        setView('login');
        if (status.email) {
          setEmail(status.email);
        }
      }
    } catch (err: any) {
      console.error('Failed to check auth status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (!isOpen) return null;

  // 1. One-time Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid owner email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerOwner(email, password);
      setIsRegistered(true);
      setRegisteredEmail(res.email);
      onAuthSuccess(res.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'One-time registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Standard Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both your owner email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginOwner(email, password);
      onAuthSuccess(res.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Request OTP Code for Forgot Password
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!email || !email.includes('@')) {
      setError('Please enter your registered owner email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.requestPasswordReset(email);
      setSuccessNotice(`Verification code dispatched to ${res.email || email}. Please check your inbox.`);
      if (res.code) {
        setGeneratedDevCode(res.code);
      }
      setView('forgot_verify');
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify OTP Code & Set New Password
  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetCode || resetCode.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please confirm your new password correctly.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(email, resetCode.trim(), newPassword);
      setSuccessNotice('Password updated successfully! Logging you in...');
      onAuthSuccess(res.token);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-[#FAF7F2] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-[#D4AF37]/50 flex flex-col my-auto">
        {/* Header */}
        <div className="bg-[#0F3826] text-[#FAF7F2] p-6 text-center border-b border-[#D4AF37]/30 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF7F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-[#14532D] border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center mx-auto mb-3 shadow">
            {view === 'register' ? (
              <KeyRound className="w-6 h-6" />
            ) : view === 'forgot_request' || view === 'forgot_verify' ? (
              <Mail className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>

          <h2 className="font-cinzel text-xl sm:text-2xl font-bold tracking-wide">
            {view === 'register'
              ? 'One-Time Owner Registration'
              : view === 'forgot_request'
              ? 'Reset Owner Password'
              : view === 'forgot_verify'
              ? 'Verify Code & Set Password'
              : 'Owner Portal Login'}
          </h2>
          <span className="text-xs text-[#FAF7F2]/75 mt-1 block tracking-wider">
            AL KAREEM MATCHING CENTRE
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {checkingStatus ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#0F3826]" />
              <span className="text-xs text-[#1A261D]/70">Checking authentication security...</span>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </div>
              )}

              {/* Success Alert */}
              {successNotice && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span className="font-medium leading-relaxed">{successNotice}</span>
                </div>
              )}

              {/* 1. ONE-TIME OWNER REGISTRATION */}
              {view === 'register' && (
                <div>
                  <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1.5">
                    <strong className="block font-bold flex items-center gap-1.5 text-amber-900">
                      <KeyRound className="w-4 h-4 text-amber-700" />
                      One-Time Registration (پہلے اونر رجسٹریشن)
                    </strong>
                    <p>
                      No owner account is currently registered. Enter your master email and set your secure password. Once completed, <strong>public registration will be permanently closed</strong> and all future access will require this email.
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                        Owner Master Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="e.g. asad2511255@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                        />
                        <Mail className="w-4 h-4 text-[#0F3826]/60 absolute left-3.5 top-3" />
                      </div>
                      <span className="text-[10px] text-[#1A261D]/55 mt-1 block">
                        This email will receive verification OTP codes if you ever forget your password.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                        Create Password (کم از کم 6 ہندسے) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Create strong password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white rounded-xl pl-10 pr-10 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                        />
                        <Lock className="w-4 h-4 text-[#0F3826]/60 absolute left-3.5 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-[#1A261D]/50 hover:text-[#0F3826]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                        />
                        <Lock className="w-4 h-4 text-[#0F3826]/60 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>Complete One-Time Registration</span>
                    </button>
                  </form>
                </div>
              )}

              {/* 2. REGULAR OWNER LOGIN (AFTER REGISTRATION) */}
              {view === 'login' && (
                <div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                        Owner Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="Enter registered email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                        />
                        <Mail className="w-4 h-4 text-[#0F3826]/60 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white rounded-xl pl-10 pr-10 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                        />
                        <Lock className="w-4 h-4 text-[#0F3826]/60 absolute left-3.5 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-[#1A261D]/50 hover:text-[#0F3826]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      <span>Login to Owner Dashboard</span>
                    </button>

                    {/* Forgot Password Button */}
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSuccessNotice(null);
                          setView('forgot_request');
                        }}
                        className="text-xs text-[#0F3826] hover:text-[#D4AF37] font-bold underline transition-colors"
                      >
                        Forgot Password? (پاسورڈ بھول گئے؟)
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 3. FORGOT PASSWORD - STEP 1: REQUEST CODE */}
              {view === 'forgot_request' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs leading-relaxed space-y-1">
                    <strong className="block font-bold text-emerald-900">
                      Password Recovery via Registered Email
                    </strong>
                    <p>
                      Enter your registered email address below. A secure 6-digit OTP code will be generated to verify your ownership.
                    </p>
                  </div>

                  <form onSubmit={handleRequestResetCode} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                        Registered Owner Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="e.g. asad2511255@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                        />
                        <Mail className="w-4 h-4 text-[#0F3826]/60 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Send 6-Digit Code (کوڈ بھیجیں)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessNotice(null);
                        setView('login');
                      }}
                      className="w-full py-2.5 text-xs text-[#1A261D]/70 hover:text-[#0F3826] font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Login</span>
                    </button>
                  </form>
                </div>
              )}

              {/* 4. FORGOT PASSWORD - STEP 2: VERIFY CODE & UPDATE PASSWORD */}
              {view === 'forgot_verify' && (
                <div className="space-y-4">
                  {/* Dev / Recovery Helper Display */}
                  {generatedDevCode && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
                      <span className="font-bold text-amber-900 block">
                        OTP Verification Code:
                      </span>
                      <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-amber-200">
                        <span className="font-mono text-base font-extrabold tracking-widest text-[#0F3826]">
                          {generatedDevCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => setResetCode(generatedDevCode)}
                          className="text-[11px] text-[#0F3826] font-bold hover:underline"
                        >
                          Auto Fill
                        </button>
                      </div>
                      <span className="text-[10px] text-amber-800/80 block">
                        Valid for 15 minutes. Enter this code below with your new password.
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyAndResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                        6-Digit Verification Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-widest font-bold border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                        New Password (نیا پاسورڈ) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Min 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-white rounded-xl pl-10 pr-10 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                        />
                        <Lock className="w-4 h-4 text-[#0F3826]/60 absolute left-3.5 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-[#1A261D]/50 hover:text-[#0F3826]"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Repeat new password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                        />
                        <Lock className="w-4 h-4 text-[#0F3826]/60 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>Update Password &amp; Login (پاسورڈ تبدیل کریں)</span>
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleRequestResetCode}
                        className="text-xs text-[#0F3826] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSuccessNotice(null);
                          setView('login');
                        }}
                        className="text-xs text-[#1A261D]/70 hover:text-[#0F3826]"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
