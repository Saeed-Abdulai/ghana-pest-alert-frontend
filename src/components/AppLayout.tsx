// ============================================================================
// APP LAYOUT COMPONENT
// Main application layout that handles routing between different views
// Manages authentication state and role-based view rendering
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStore } from '@/store/authStore';
import { useAlertStore, SAMPLE_ALERTS, SAMPLE_VALIDATION_QUEUE } from '@/store/alertStore';

// Import components
import Header from '@/components/shared/Header';
import Sidebar from '@/components/shared/Sidebar';
import LoginModal from '@/components/shared/LoginModal';
import RegisterModal from '@/components/shared/RegisterModal';
import LandingPage from '@/components/LandingPage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import FarmerManagement from '@/components/admin/FarmerManagement';
import OfficerManagement from '@/components/admin/OfficerManagement';
import SMSBroadcast from '@/components/admin/SMSBroadcast';
import AIAnalysis from '@/components/admin/AIAnalysis';
import AlertsView from '@/components/admin/AlertsView';
import ValidationQueue from '@/components/extension/ValidationQueue';
import FarmerDashboard from '@/components/farmer/FarmerDashboard';


const AppLayout: React.FC = () => {
  // Get context and hooks
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();
  
  // Get auth state
  const { user, initialize, } = useAuthStore();
  
  // Initialize alert store with sample data
  const { setAlerts, setValidationQueue } = useAlertStore();
  
  // Local state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize sample data on first render
  useEffect(() => {
    setAlerts(SAMPLE_ALERTS);
    setValidationQueue(SAMPLE_VALIDATION_QUEUE);
  }, [setAlerts, setValidationQueue]);

  // Handle switching between login and register modals
  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleNavigate = (view: string) => {
    setActiveView(view);
  };

  // Render the appropriate view based on user role and active view
const renderView = () => {
  const role = user?.role;

  // Farmer & Subscriber views
  if (role === 'farmer' || role === 'subscriber') {
    switch (activeView) {
      case 'alerts':
        return <FarmerDashboard />;
      default:
        return <FarmerDashboard />;
    }
  }

  // Extension officer views
  if (role === 'extension_officer') {
    switch (activeView) {
      case 'validation':
        return <ValidationQueue />;
      case 'alerts':
        return <AlertsView />;
      case 'ai-analysis':
        return <AIAnalysis />;
      default:
        return <ValidationQueue />;
    }
  }

  // Admin views (ONLY admin)
  if (role === 'admin') {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'alerts':
        return <AlertsView />;
      case 'ai-analysis':
        return <AIAnalysis />;
      case 'validation':
        return <ValidationQueue />;
      case 'farmers':
        return <FarmerManagement />;
      case 'officers':
        return <OfficerManagement />;
      case 'sms':
      case 'notifications':
        return <SMSBroadcast />;
      case 'reports':
      case 'settings':
        return <AdminDashboard onNavigate={handleNavigate} />;
      default:
        return <AdminDashboard onNavigate={handleNavigate} />;
    }
  }

  // Fallback (unknown role)
  return <FarmerDashboard />;
};


  // If not logged in, show landing page
  if (!user) {
    return (
      <>
        <LandingPage onLogin={() => setShowLoginModal(true)} />
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={handleSwitchToRegister}
        />
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </>
    );
  }

  // Logged in - show dashboard layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        isSidebarOpen={mobileSidebarOpen}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          activeView={activeView}
          onViewChange={handleNavigate}
        />

        {/* Main content area */}
        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-64px)] overflow-x-hidden">
          {/* Breadcrumb / Page indicator */}
          <div className="mb-4 lg:hidden">
            <p className="text-sm text-gray-500 capitalize">
              {activeView.replace('-', ' ')}
            </p>
          </div>

          {/* Render active view */}
          {renderView()}
        </main>
      </div>

      {/* Modals for re-authentication if needed */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

export default AppLayout;
