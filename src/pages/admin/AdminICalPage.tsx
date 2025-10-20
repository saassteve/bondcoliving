import React from 'react';
import { Helmet } from 'react-helmet-async';
import ICalManager from '../../components/admin/ICalManager';

const AdminICalPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>iCal Sync - Admin - Bond Coliving</title>
      </Helmet>
      <div className="container py-8">
        <ICalManager />
      </div>
    </>
  );
};

export default AdminICalPage;
