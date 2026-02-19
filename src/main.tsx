import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';

// Components
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import GuestProtectedRoute from './components/GuestProtectedRoute';
import Preloader from './components/Preloader';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import GuestLayout from './layouts/GuestLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ThankYouPage from './pages/public/ThankYouPage';
import CoworkingPage from './pages/public/CoworkingPage';
import CoworkingBookingPage from './pages/public/CoworkingBookingPage';
import CoworkingBookingSuccessPage from './pages/public/CoworkingBookingSuccessPage';
import CoworkingBookingLookupPage from './pages/public/CoworkingBookingLookupPage';
import RoomDetailPage from './pages/public/RoomDetailPage';
import LoginPage from './pages/public/LoginPage';
import SearchResultsPage from './pages/public/SearchResultsPage';
import BookPage from './pages/public/BookPage';
import BookingSuccessPage from './pages/public/BookingSuccessPage';
import BookingLookupPage from './pages/public/BookingLookupPage';
import LocationDetailPage from './pages/public/LocationDetailPage';
import LocationsPage from './pages/public/LocationsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminBuildingsPage from './pages/admin/AdminBuildingsPage';
import AdminCoworkingPage from './pages/admin/AdminCoworkingPage';
import AdminGuestsPage from './pages/admin/AdminGuestsPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage';
import AdminAccountPage from './pages/admin/AdminAccountPage';
import AdminICalPage from './pages/admin/AdminICalPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminLocalInfoPage from './pages/admin/AdminLocalInfoPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminMessagesPage from './pages/admin/AdminMessagesPage';
import AdminOperationsPage from './pages/admin/AdminOperationsPage';
import AdminCommunicationsPage from './pages/admin/AdminCommunicationsPage';
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage';
import AdminResetPasswordPage from './pages/admin/AdminResetPasswordPage';
import AdminImageMigrationPage from './pages/admin/AdminImageMigrationPage';
import AdminApiKeysPage from './pages/admin/AdminApiKeysPage';

// Guest Pages
import GuestRegisterPage from './pages/guest/GuestRegisterPage';
import GuestLoginPage from './pages/guest/GuestLoginPage';
import GuestDashboardPage from './pages/guest/GuestDashboardPage';
import GuestCommunityPage from './pages/guest/GuestCommunityPage';
import GuestProfilePage from './pages/guest/GuestProfilePage';
import GuestEventsPage from './pages/guest/GuestEventsPage';
import GuestMessagesPage from './pages/guest/GuestMessagesPage';
import GuestLocalInfoPage from './pages/guest/GuestLocalInfoPage';
import GuestServicesPage from './pages/guest/GuestServicesPage';
import GuestExtendStayPage from './pages/guest/GuestExtendStayPage';
import GuestAnnouncementsPage from './pages/guest/GuestAnnouncementsPage';
import GuestNotificationsPage from './pages/guest/GuestNotificationsPage';
import GuestSettingsPage from './pages/guest/GuestSettingsPage';
import GuestForgotPasswordPage from './pages/guest/GuestForgotPasswordPage';
import GuestResetPasswordPage from './pages/guest/GuestResetPasswordPage';

const App = () => {
  // Check if preloader has already been shown in this session
  const hasShownPreloader = sessionStorage.getItem('preloaderShown');
  const [isLoading, setIsLoading] = useState(!hasShownPreloader);

  const handleLoadingComplete = () => {
    sessionStorage.setItem('preloaderShown', 'true');
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
            <Route path="apply" element={<Navigate to="/book" replace />} />
            <Route path="book" element={<BookPage />} />
            <Route path="book/success" element={<BookingSuccessPage />} />
            <Route path="book/lookup" element={<BookingLookupPage />} />
            <Route path="thank-you" element={<ThankYouPage />} />
            <Route path="coworking" element={<CoworkingPage />} />
            <Route path="coworking/book" element={<CoworkingBookingPage />} />
            <Route path="coworking/booking/success" element={<CoworkingBookingSuccessPage />} />
            <Route path="coworking/booking/lookup" element={<CoworkingBookingLookupPage />} />
            <Route path="room/:roomSlug" element={<RoomDetailPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="location/:slug" element={<LocationDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="search" element={<SearchResultsPage />} />
            {/* Catch-all route for 404s */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          
          {/* Admin Routes - Public */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
          <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />

          {/* Admin Routes - Protected */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="bookings" element={<ProtectedRoute><AdminBookingsPage /></ProtectedRoute>} />
            <Route path="rooms" element={<ProtectedRoute><AdminRoomsPage /></ProtectedRoute>} />
            <Route path="buildings" element={<ProtectedRoute><AdminBuildingsPage /></ProtectedRoute>} />
            <Route path="ical" element={<ProtectedRoute><AdminICalPage /></ProtectedRoute>} />
            <Route path="coworking" element={<ProtectedRoute><AdminCoworkingPage /></ProtectedRoute>} />
            <Route path="guests" element={<ProtectedRoute><AdminGuestsPage /></ProtectedRoute>} />
            <Route path="announcements" element={<ProtectedRoute><AdminAnnouncementsPage /></ProtectedRoute>} />
            <Route path="events" element={<ProtectedRoute><AdminEventsPage /></ProtectedRoute>} />
            <Route path="local-info" element={<ProtectedRoute><AdminLocalInfoPage /></ProtectedRoute>} />
            <Route path="services" element={<ProtectedRoute><AdminServicesPage /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute><AdminMessagesPage /></ProtectedRoute>} />
            <Route path="operations" element={<ProtectedRoute><AdminOperationsPage /></ProtectedRoute>} />
            <Route path="communications" element={<ProtectedRoute><AdminCommunicationsPage /></ProtectedRoute>} />
            <Route path="promotions" element={<ProtectedRoute><AdminPromotionsPage /></ProtectedRoute>} />
            <Route path="image-migration" element={<ProtectedRoute><AdminImageMigrationPage /></ProtectedRoute>} />
            <Route path="api-keys" element={<ProtectedRoute><AdminApiKeysPage /></ProtectedRoute>} />
            <Route path="account" element={<ProtectedRoute><AdminAccountPage /></ProtectedRoute>} />
            {/* Admin catch-all */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* Guest Routes - Public */}
          <Route path="/guest/register" element={<GuestRegisterPage />} />
          <Route path="/guest/login" element={<GuestLoginPage />} />
          <Route path="/guest/forgot-password" element={<GuestForgotPasswordPage />} />
          <Route path="/guest/reset-password" element={<GuestResetPasswordPage />} />

          {/* Guest Routes - Protected */}
          <Route path="/guest" element={<GuestProtectedRoute><GuestLayout /></GuestProtectedRoute>}>
            <Route index element={<Navigate to="/guest/dashboard" replace />} />
            <Route path="dashboard" element={<GuestDashboardPage />} />
            <Route path="community" element={<GuestCommunityPage />} />
            <Route path="community/:userId" element={<GuestProfilePage />} />
            <Route path="events" element={<GuestEventsPage />} />
            <Route path="messages" element={<GuestMessagesPage />} />
            <Route path="local-info" element={<GuestProtectedRoute requiredUserType="overnight"><GuestLocalInfoPage /></GuestProtectedRoute>} />
            <Route path="services" element={<GuestProtectedRoute requiredUserType="overnight"><GuestServicesPage /></GuestProtectedRoute>} />
            <Route path="extend-stay" element={<GuestProtectedRoute requiredUserType="overnight"><GuestExtendStayPage /></GuestProtectedRoute>} />
            <Route path="announcements" element={<GuestAnnouncementsPage />} />
            <Route path="notifications" element={<GuestNotificationsPage />} />
            <Route path="settings" element={<GuestSettingsPage />} />
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