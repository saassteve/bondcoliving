import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import bondLogo from '../../assets/bond_logo_main.png';

interface Props {
  userType: 'admin' | 'guest';
  onValidateToken: (token: string) => Promise<{ valid: boolean; error?: string }>;
  onResetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginPath: string;
  forgotPasswordPath: string;
}

const ResetPasswordForm: React.FC<Props> = ({
  userType,
  onValidateToken,
  onResetPassword,
  loginPath,
  forgotPasswordPath,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidatingToken(false);
        return;
      }

      try {
        const result = await onValidateToken(token);
        setTokenValid(result.valid);
      } catch (err) {
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token, onValidateToken]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      const result = await onResetPassword(token, password);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate(loginPath), 3000);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userType === 'admin';
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E1F1E]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5C5B5] mx-auto"></div>
          <p className="mt-4 text-[#C5C5B5]">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#1E1F1E]"></div>
        <div className="relative z-10 max-w-md w-full">
          <div className="bg-[#1E1F1E]/90 backdrop-blur-xl border border-[#C5C5B5]/20 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
            <img src={bondLogo} alt="Bond" className="h-12 w-auto mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-red-400 mb-4">Invalid or Expired Link</h1>
            <p className="text-[#C5C5B5]/80 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to={forgotPasswordPath}
              className="inline-flex items-center px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-full font-semibold transition-all hover:bg-white"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative flex items-center ${isAdmin ? '' : 'justify-center p-4'}`}>
      <div className="absolute inset-0 bg-black/70 z-10"></div>
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>

      <div className={`relative z-20 max-w-md w-full ${isAdmin ? 'container mx-auto' : ''}`}>
        <Link
          to={loginPath}
          className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="bg-[#1E1F1E]/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#C5C5B5]/10">
          <div className="text-center mb-8">
            <img src={bondLogo} alt="Bond" className="h-12 w-auto mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                Create New Password
              </span>
            </h1>
            <p className="text-[#C5C5B5]/80">
              {success ? "Your password has been reset successfully" : "Enter your new password below"}
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="p-6 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl">
                <div className="flex items-start">
                  <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-2">Password Reset Complete</p>
                    <p className="text-sm text-green-400/80">
                      You can now sign in with your new password. Redirecting...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <label htmlFor="password" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-4 pr-12 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all disabled:opacity-50"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#C5C5B5]/60 hover:text-[#C5C5B5]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {[
                        { check: passwordChecks.length, label: '8+ characters' },
                        { check: passwordChecks.uppercase, label: 'Uppercase letter' },
                        { check: passwordChecks.lowercase, label: 'Lowercase letter' },
                        { check: passwordChecks.number, label: 'Number' },
                      ].map((item, idx) => (
                        <div key={idx} className={`flex items-center ${item.check ? 'text-green-400' : 'text-[#C5C5B5]/40'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${item.check ? 'bg-green-400' : 'bg-[#C5C5B5]/40'}`}></div>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="confirmPassword" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-4 pr-12 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all disabled:opacity-50"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#C5C5B5]/60 hover:text-[#C5C5B5]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full font-semibold text-sm uppercase tracking-wide transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E1F1E] mr-3"></div>
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-3" />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
