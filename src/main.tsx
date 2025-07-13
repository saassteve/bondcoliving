import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';

// Components
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import Preloader from './components/Preloader';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ApplicationFormPage from './pages/public/ApplicationFormPage';
import ThankYouPage from './pages/public/ThankYouPage';
import CoworkingPage from './pages/public/CoworkingPage';
import RoomDetailPage from './pages/public/RoomDetailPage';
import LoginPage from './pages/public/LoginPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminCoworkingPage from './pages/admin/AdminCoworkingPage';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <Preloader onComplete={handleLoadingComplete} />;
  }

  return (
    <HelmetProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="apply" element={<ApplicationFormPage />} />
            <Route path="thank-you" element={<ThankYouPage />} />
            <Route path="coworking" element={<CoworkingPage />} />
            <Route path="room/:roomId" element={<RoomDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            {/* Catch-all route for 404s */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="applications" element={<ProtectedRoute><AdminApplicationsPage /></ProtectedRoute>} />
            <Route path="rooms" element={<ProtectedRoute><AdminRoomsPage /></ProtectedRoute>} />
            <Route path="coworking" element={<ProtectedRoute><AdminCoworkingPage /></ProtectedRoute>} />
            {/* Admin catch-all */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          
          {/* Global catch-all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
};
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);