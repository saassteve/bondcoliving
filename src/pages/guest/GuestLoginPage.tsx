import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInGuest } from '../../lib/guestAuth';

export default function GuestLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signInGuest(email, password);

    if (result.success) {
      navigate('/guest/dashboard');
    } else {
      setError(result.error || 'Failed to sign in');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1E1F1E]"></div>
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center opacity-10"></div>

      <div className="relative z-10 bg-[#1E1F1E]/90 backdrop-blur-xl border border-[#C5C5B5]/20 rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src="https://iili.io/FcjToIp.png"
            alt="Bond"
            className="h-12 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
              Welcome Back
            </span>
          </h1>
          <p className="text-[#C5C5B5]/80">Sign in to access the Bond community</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all"
              placeholder="Enter your password"
              required
            />
            <div className="mt-2 text-right">
              <Link
                to="/guest/forgot-password"
                className="text-sm text-[#C5C5B5]/60 hover:text-[#C5C5B5] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C5C5B5] text-[#1E1F1E] py-4 rounded-full font-semibold text-sm uppercase tracking-wide transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#C5C5B5]/60">
            Don't have an account?{' '}
            <Link to="/guest/register" className="text-[#C5C5B5] hover:text-white font-medium transition-colors">
              Register with invitation code
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-[#C5C5B5]/20">
          <Link
            to="/"
            className="flex items-center justify-center text-sm text-[#C5C5B5]/60 hover:text-[#C5C5B5] transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
}
