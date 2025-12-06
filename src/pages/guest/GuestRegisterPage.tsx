import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { validateInvitationCode, registerGuestUser, GuestInvitation } from '../../lib/guestAuth';
import bondLogo from '../../assets/bond_logo_main.png';

export default function GuestRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codeFromUrl = searchParams.get('code') || '';

  const [step, setStep] = useState<'validate' | 'profile' | 'complete'>('validate');
  const [invitationCode, setInvitationCode] = useState(codeFromUrl);
  const [invitation, setInvitation] = useState<GuestInvitation | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await validateInvitationCode(invitationCode.toUpperCase());

    if (result.valid && result.invitation) {
      setInvitation(result.invitation);
      setStep('profile');
    } else {
      setError(result.error || 'Invalid invitation code');
    }

    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!invitation) return;

    setLoading(true);

    const interestsArray = interests
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const result = await registerGuestUser(invitation, password, {
      bio: bio || undefined,
      interests: interestsArray.length > 0 ? interestsArray : undefined,
    });

    if (result.success) {
      setStep('complete');
      setTimeout(() => {
        navigate('/guest/dashboard');
      }, 2000);
    } else {
      setError(result.error || 'Failed to create account');
    }

    setLoading(false);
  };

  if (step === 'complete') {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#1E1F1E]"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center opacity-10"></div>

        <div className="relative z-10 bg-[#1E1F1E]/90 backdrop-blur-xl border border-[#C5C5B5]/20 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#C5C5B5]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#C5C5B5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Bond!</h1>
          <p className="text-[#C5C5B5]/80">Your account has been created successfully. Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1E1F1E]"></div>
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center opacity-10"></div>

      <div className="relative z-10 bg-[#1E1F1E]/90 backdrop-blur-xl border border-[#C5C5B5]/20 rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src={bondLogo}
            alt="Bond"
            className="h-12 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
              Join the Bond Community
            </span>
          </h1>
          <p className="text-[#C5C5B5]/80">
            {step === 'validate' ? 'Enter your invitation code to get started' : 'Complete your profile'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {step === 'validate' ? (
          <form onSubmit={handleValidateCode} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
                Invitation Code
              </label>
              <input
                type="text"
                id="code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all text-center text-lg font-mono tracking-wider"
                placeholder="XXXX-XXXX"
                maxLength={9}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !invitationCode}
              className="w-full bg-[#C5C5B5] text-[#1E1F1E] py-4 rounded-full font-semibold text-sm uppercase tracking-wide transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Validating...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="p-4 bg-[#C5C5B5]/10 border border-[#C5C5B5]/20 rounded-2xl mb-6">
              <p className="text-sm text-[#C5C5B5]">
                <span className="font-semibold text-white">{invitation?.full_name}</span>
                <br />
                <span className="text-[#C5C5B5]/70">{invitation?.email}</span>
                <br />
                <span className="inline-block mt-2 px-3 py-1 bg-[#C5C5B5]/20 text-[#C5C5B5] rounded-full text-xs font-medium uppercase tracking-wide">
                  {invitation?.user_type === 'overnight' ? 'Overnight Guest' : 'Coworking Member'}
                </span>
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
                Create Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all"
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all"
                placeholder="Re-enter password"
                required
              />
            </div>

            <div className="border-t border-[#C5C5B5]/20 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tell us about yourself (optional)</h3>

              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all"
                  placeholder="Tell the community a bit about yourself..."
                />
              </div>

              <div>
                <label htmlFor="interests" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
                  Interests
                </label>
                <input
                  type="text"
                  id="interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all"
                  placeholder="Hiking, Coffee, Tech, Music (comma-separated)"
                />
                <p className="mt-1 text-xs text-[#C5C5B5]/50">Separate multiple interests with commas</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C5C5B5] text-[#1E1F1E] py-4 rounded-full font-semibold text-sm uppercase tracking-wide transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-[#C5C5B5]/60">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/guest/login')}
              className="text-[#C5C5B5] hover:text-white font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
