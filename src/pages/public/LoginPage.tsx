import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';
import { authService, useAuth } from '../../lib/auth';
import bondLogo from '../../assets/bond_logo_main.png';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/admin" replace />;
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await authService.signIn(credentials.email, credentials.password);
      
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Admin Login - Bond</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      {/* Hero Section with Brand Consistency */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>
        
        <div className="container relative z-20">
          <div className="max-w-md mx-auto">
            {/* Back to Home Link */}
            <Link 
              to="/" 
              className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>

            {/* Login Card */}
            <div className="bg-[#1E1F1E]/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#C5C5B5]/10">
              <div className="text-center mb-8">
                <img
                  src={bondLogo}
                  alt="Bond"
                  className="h-12 w-auto mx-auto mb-6"
                />
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                    Admin Access
                  </span>
                </h1>
                <p className="text-[#C5C5B5]/80">
                  Sign in to access the Bond admin dashboard
                </p>
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <label htmlFor="email" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={credentials.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all disabled:opacity-50"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="relative group">
                  <label htmlFor="password" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={credentials.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all disabled:opacity-50"
                    placeholder="Enter your password"
                  />
                  <div className="mt-2 text-right">
                    <Link
                      to="/admin/forgot-password"
                      className="text-sm text-[#C5C5B5]/60 hover:text-[#C5C5B5] transition-colors"
                    >
                      Forgot password?
                    </Link>
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
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-3" />
                        Sign in
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="mt-8 text-center">
                <p className="text-xs text-[#C5C5B5]/40">
                  Authorized access only
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default LoginPage;