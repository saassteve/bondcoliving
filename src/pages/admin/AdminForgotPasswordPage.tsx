import React from 'react';
import { Helmet } from 'react-helmet-async';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { requestPasswordReset } from '../../lib/auth';

const AdminForgotPasswordPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Forgot Password - Bond Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <ForgotPasswordForm
        userType="admin"
        onRequestReset={requestPasswordReset}
        loginPath="/admin/login"
      />
    </>
  );
};

export default AdminForgotPasswordPage;
