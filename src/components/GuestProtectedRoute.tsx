import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentGuestUser } from '../lib/guestAuth';

interface GuestProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'overnight' | 'coworking';
}

export default function GuestProtectedRoute({ children, requiredUserType }: GuestProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [requiredUserType]);

  const checkAuth = async () => {
    const guestUser = await getCurrentGuestUser();

    if (!guestUser) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    if (guestUser.status !== 'active') {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    const now = new Date();
    const endDate = new Date(guestUser.access_end_date);
    const gracePeriodEnd = new Date(endDate.getTime() + guestUser.grace_period_days * 24 * 60 * 60 * 1000);

    if (now > gracePeriodEnd) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    if (requiredUserType && guestUser.user_type !== requiredUserType) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    setIsAuthorized(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/guest/login" replace />;
  }

  return <>{children}</>;
}
