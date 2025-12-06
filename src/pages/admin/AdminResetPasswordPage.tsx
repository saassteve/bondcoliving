import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { validateResetToken, resetPasswordWithToken } from '../../lib/auth';
import bondLogo from '../../assets/bond_logo_main.png';

const AdminResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setValidating(false);
      return;
    }

    const checkToken = async () => {
      const result = await validateResetToken(token);
      setTokenValid(result.valid);
      if (!result.valid) {
        setError(result.error || 'Invalid or expired reset link');
      }
      setValidating(false);
    };

    checkToken();
  }, [token]);

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: '', color: '' };
    if (password.length < 8) return { strength: 'Too short', color: 'text-red-400' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 'Weak', color: 'text-red-400' };
    if (strength <= 4) return { strength: 'Medium', color: 'text-yellow-400' };
    return { strength: 'Strong', color: 'text-green-400' };
  };

  const passwordStrength = getPasswordStrength(passwords.password);
  const passwordsMatch = passwords.password === passwords.confirmPassword && passwords.confirmPassword.length > 0;
  const passwordsDontMatch = passwords.confirmPassword.length > 0 && !passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwords.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPasswordWithToken(token!, passwords.password);

      if (result.success) {
        navigate('/admin/login?reset=success');
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <>
        <Helmet>
          <title>Reset Password - Bond Admin</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <section className="relative min-h-screen flex items-center">
          <div className="absolute inset-0 bg-black/70 z-10"></div>
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>

          <div className="container relative z-20">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-[#1E1F1E]/90 backdrop-blur-sm rounded-3xl p-12 border border-[#C5C5B5]/10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5C5B5] mx-auto mb-4"></div>
                <p className="text-[#C5C5B5]/80">Validating reset link...</p>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!tokenValid) {
    return (
      <>
        <Helmet>
          <title>Invalid Link - Bond Admin</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <section className="relative min-h-screen flex items-center">
          <div className="absolute inset-0 bg-black/70 z-10"></div>
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>

          <div className="container relative z-20">
            <div className="max-w-md mx-auto">
              <Link
                to="/admin/forgot-password"
                className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Request New Link
              </Link>

              <div className="bg-[#1E1F1E]/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#C5C5B5]/10">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h1>
                  <p className="text-[#C5C5B5]/80 mb-8">{error}</p>

                  <Link
                    to="/admin/forgot-password"
                    className="inline-block px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full font-semibold text-sm uppercase tracking-wide transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105"
                  >
                    Request New Reset Link
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reset Password - Bond Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>

        <div className="container relative z-20">
          <div className="max-w-md mx-auto">
            <Link
              to="/admin/login"
              className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>

            <div className="bg-[#1E1F1E]/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#C5C5B5]/10">
              <div className="text-center mb-8">
                <img
                  src={bondLogo}
                  alt="Bond"
                  className="h-12 w-auto mx-auto mb-6"
                />
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                    Create New Password
                  </span>
                </h1>
                <p className="text-[#C5C5B5]/80">
                  Choose a strong password for your admin account
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <label
                    htmlFor="password"
                    className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={passwords.password}
                      onChange={(e) =>
                        setPasswords((prev) => ({ ...prev, password: e.target.value }))
                      }
                      disabled={loading}
                      autoFocus
                      className="w-full px-4 py-4 pr-12 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all disabled:opacity-50"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C5C5B5]/60 hover:text-[#C5C5B5] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwords.password && (
                    <p className={`mt-2 text-sm ${passwordStrength.color}`}>
                      Strength: {passwordStrength.strength}
                    </p>
                  )}
                </div>

                <div className="relative group">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={passwords.confirmPassword}
                      onChange={(e) =>
                        setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      disabled={loading}
                      className="w-full px-4 py-4 pr-12 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all disabled:opacity-50"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C5C5B5]/60 hover:text-[#C5C5B5] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordsMatch && (
                    <p className="mt-2 text-sm text-green-400 flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Passwords match
                    </p>
                  )}
                  {passwordsDontMatch && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <X className="w-4 h-4 mr-1" />
                      Passwords do not match
                    </p>
                  )}
                </div>

                <div className="p-4 bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl">
                  <p className="text-xs text-[#C5C5B5]/60 mb-2">
                    <strong className="text-[#C5C5B5]">Password Requirements:</strong>
                  </p>
                  <ul className="text-xs text-[#C5C5B5]/60 space-y-1">
                    <li className="flex items-center">
                      <span className={passwords.password.length >= 8 ? 'text-green-400' : 'text-[#C5C5B5]/40'}>
                        {passwords.password.length >= 8 ? '✓' : '○'}
                      </span>
                      <span className="ml-2">At least 8 characters</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || !passwordsMatch || passwords.password.length < 8}
                    className="w-full flex justify-center items-center px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full font-semibold text-sm uppercase tracking-wide transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E1F1E] mr-3"></div>
                        Resetting Password...
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
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminResetPasswordPage;
