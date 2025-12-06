import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { requestPasswordReset } from '../../lib/guestAuth';
import bondLogo from '../../assets/bond_logo_main.png';

const GuestForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1E1F1E]"></div>
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center opacity-10"></div>

      <div className="relative z-10 max-w-md w-full">
        <Link
          to="/guest/login"
          className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="bg-[#1E1F1E]/90 backdrop-blur-xl border border-[#C5C5B5]/20 rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <img
              src={bondLogo}
              alt="Bond"
              className="h-12 w-auto mx-auto mb-6"
            />
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                Reset Password
              </span>
            </h1>
            <p className="text-[#C5C5B5]/80">
              {success
                ? "Check your email for reset instructions"
                : "Enter your email to receive password reset instructions"}
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
                <div className="flex items-start text-green-400">
                  <Mail className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-2">Email Sent Successfully</p>
                    <p className="text-sm text-green-400/80">
                      If an account exists with that email, you'll receive reset instructions within 5 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl">
                <p className="text-sm text-[#C5C5B5]/80 mb-2">
                  <strong className="text-[#C5C5B5]">Didn't receive the email?</strong>
                </p>
                <ul className="text-xs text-[#C5C5B5]/60 space-y-1 ml-4 list-disc">
                  <li>Check your spam or junk folder</li>
                  <li>Wait a few minutes for the email to arrive</li>
                  <li>Verify you entered the correct email address</li>
                </ul>
              </div>

              <div className="text-center text-sm text-[#C5C5B5]/60">
                Need help?{' '}
                <a
                  href="mailto:hello@stayatbond.com"
                  className="text-[#C5C5B5] hover:text-white transition-colors"
                >
                  Contact support
                </a>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoFocus
                    className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all disabled:opacity-50"
                    placeholder="your@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center bg-[#C5C5B5] text-[#1E1F1E] py-4 rounded-full font-semibold text-sm uppercase tracking-wide transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E1F1E] mr-3"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-3" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-[#C5C5B5]/60">
                  Remember your password?{' '}
                  <Link
                    to="/guest/login"
                    className="text-[#C5C5B5] hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestForgotPasswordPage;
