import React from 'react';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import { validateResetToken, resetPasswordWithToken } from '../../lib/guestAuth';

const GuestResetPasswordPage: React.FC = () => {
  return (
    <ResetPasswordForm
      userType="guest"
      onValidateToken={validateResetToken}
      onResetPassword={resetPasswordWithToken}
      loginPath="/guest/login"
      forgotPasswordPath="/guest/forgot-password"
    />
  );
};

export default GuestResetPasswordPage;
