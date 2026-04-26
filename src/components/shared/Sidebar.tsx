// ============================================================================
// SIDEBAR COMPONENT
// Role-based navigation sidebar with collapsible menu items
// Displays different menu options based on user role
// ============================================================================

import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  UserCheck,
  FileText,
  Send,
  CheckCircle,
  Leaf,
  Bot,
  X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// Interface for navigation items
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: string[]; // Which roles can see this item
  badge?: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  activeView, 
  onViewChange 
}) => {
  // Get current user from auth store
  const { user } = useAuthStore();

  // Define navigation items with role-based access
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['admin'], // admin only
    },
    {
      id: 'alerts',
      label: 'Pest Alerts',
      icon: <AlertTriangle className="w-5 h-5" />,
      roles: ['admin', 'farmer'], // farmer and extension officer removed
    },
    {
      id: 'ai-analysis',
      label: 'AI Analysis',
      icon: <Bot className="w-5 h-5" />,
      roles: ['admin'], // ❌ extension officer removed
    },
    {
      id: 'validation',
      label: 'Validation Queue',
      icon: <CheckCircle className="w-5 h-5" />,
      roles: ['extension_officer'], // ✅ extension officer only
    },
    {
      id: 'farmers',
      label: 'Manage Farmers',
      icon: <Users className="w-5 h-5" />,
      roles: ['admin'],
    },
    {
      id: 'officers',
      label: 'Extension Officers',
      icon: <UserCheck className="w-5 h-5" />,
      roles: ['admin'],
    },
    {
      id: 'sms',
      label: 'SMS Alerts',
      icon: <Send className="w-5 h-5" />,
      roles: ['admin'],
    },
  ];
  

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    item => user && item.roles.includes(user.role)
  );

  // Handle navigation item click
  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-900">Pest Alert</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)] lg:h-[calc(100vh-20px)]">
          {/* Section label */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            Main Menu
          </p>

          {/* Navigation items */}
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200 text-left
                ${activeView === item.id
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {/* Icon with active state styling */}
              <span className={activeView === item.id ? 'text-green-600' : 'text-gray-400'}>
                {item.icon}
              </span>
              
              {/* Label */}
              <span className="flex-1">{item.label}</span>
              
              {/* Badge if present */}
              {item.badge && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          {/* Divider */}
          <div className="my-4 border-t border-gray-200" />

          {/* Help section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
  <div className="flex items-center gap-3 mb-3">
    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
      <FileText className="w-5 h-5 text-green-600" />
    </div>
    <div>
      <p className="font-medium text-gray-900 text-sm">Need Help?</p>
      <p className="text-xs text-gray-500">View documentation</p>
    </div>
  </div>
  <button
    onClick={() => {
      const guide = `GHANA PEST ALERT SYSTEM - USER GUIDE\n\n` +
        `ADMIN GUIDE:\n` +
        `• Dashboard: View real-time stats\n` +
        `• Create Alert: Manual alerts go to validation queue\n` +
        `• External Source: Publishes immediately\n` +
        `• AI Analysis: GPT generates alert content\n` +
        `• Assign Officer: Send alert to specific officer\n` +
        `• Publish: Publish approved alerts to farmers\n` +
        `• Manage Farmers: Approve/reject registrations\n` +
        `• Extension Officers: Add/remove officers\n` +
        `• SMS Broadcast: Send SMS to farmers\n\n` +
        `EXTENSION OFFICER GUIDE:\n` +
        `• Validation Queue: Review pending alerts\n` +
        `• Expand alert to see full details\n` +
        `• Edit Content: Modify before approving\n` +
        `• Approve: Alert goes back to admin to publish\n` +
        `• Reject: Alert is rejected with reason\n\n` +
        `FARMER GUIDE:\n` +
        `• Dashboard shows alerts for your region\n` +
        `• Click any alert for full details\n` +
        `• Check symptoms and prevention measures\n` +
        `• Contact extension officer for help\n\n` +
        `CREDENTIALS:\n` +
        `• Admin: admin@pestalert.gh / Admin2024\n` +
        `• Officer: officer@pestalert.gh / Officer2024`;
      alert(guide);
    }}
    className="w-full py-2 text-sm font-medium text-green-700 bg-white rounded-lg hover:bg-green-50 transition-colors border border-green-200"
  >
    View Guide
  </button>
</div>

          {/* User region info */}
          {user && user.region && (
            <div className="mt-4 px-3 py-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Your Region</p>
              <p className="text-sm font-medium text-gray-900">{user.region}</p>
              {user.district && (
                <p className="text-xs text-gray-500">{user.district}</p>
              )}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
