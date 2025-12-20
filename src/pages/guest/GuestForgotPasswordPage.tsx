import React from 'react';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { requestPasswordReset } from '../../lib/guestAuth';

const GuestForgotPasswordPage: React.FC = () => {
  return (
    <ForgotPasswordForm
      userType="guest"
      onRequestReset={requestPasswordReset}
      loginPath="/guest/login"
    />
  );
};

export default GuestForgotPasswordPage;
