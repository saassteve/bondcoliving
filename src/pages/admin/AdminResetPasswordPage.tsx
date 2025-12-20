import React from 'react';
import { Helmet } from 'react-helmet-async';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import { validateResetToken, resetPasswordWithToken } from '../../lib/auth';

const AdminResetPasswordPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Reset Password - Bond Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <ResetPasswordForm
        userType="admin"
        onValidateToken={validateResetToken}
        onResetPassword={resetPasswordWithToken}
        loginPath="/admin/login"
        forgotPasswordPath="/admin/forgot-password"
      />
    </>
  );
};

export default AdminResetPasswordPage;
