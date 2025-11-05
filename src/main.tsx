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
import CoworkingBookingPage from './pages/public/CoworkingBookingPage';
import CoworkingBookingSuccessPage from './pages/public/CoworkingBookingSuccessPage';
import CoworkingBookingLookupPage from './pages/public/CoworkingBookingLookupPage';
import RoomDetailPage from './pages/public/RoomDetailPage';
import LoginPage from './pages/public/LoginPage';
import SearchResultsPage from './pages/public/SearchResultsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminCoworkingPage from './pages/admin/AdminCoworkingPage';
import AdminAccountPage from './pages/admin/AdminAccountPage';
import AdminICalPage from './pages/admin/AdminICalPage';

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
            <Route path="coworking/book" element={<CoworkingBookingPage />} />
            <Route path="coworking/booking/success" element={<CoworkingBookingSuccessPage />} />
            <Route path="coworking/booking/lookup" element={<CoworkingBookingLookupPage />} />
            <Route path="room/:roomSlug" element={<RoomDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="search" element={<SearchResultsPage />} />
            {/* Catch-all route for 404s */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="applications" element={<ProtectedRoute><AdminApplicationsPage /></ProtectedRoute>} />
            <Route path="bookings" element={<ProtectedRoute><AdminBookingsPage /></ProtectedRoute>} />
            <Route path="rooms" element={<ProtectedRoute><AdminRoomsPage /></ProtectedRoute>} />
            <Route path="ical" element={<ProtectedRoute><AdminICalPage /></ProtectedRoute>} />
            <Route path="coworking" element={<ProtectedRoute><AdminCoworkingPage /></ProtectedRoute>} />
            <Route path="account" element={<ProtectedRoute><AdminAccountPage /></ProtectedRoute>} />
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