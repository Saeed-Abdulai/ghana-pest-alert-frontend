// ============================================================================
// HEADER COMPONENT
// Main navigation header with role-based menu items
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Bell, Menu, X, User, LogOut, Settings,
  ChevronDown, Shield, Leaf, MapPin, Phone,
  Mail, Clock, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { validationApi, alertsApi } from '@/services/backendApi';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, logout } = useAuthStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user && user.role !== 'farmer') {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      if (user?.role === 'admin') {
        const response = await alertsApi.getAll({ status: 'approved' });
        const approved = response.alerts || [];
        setPendingCount(approved.length);
        setNotifications(approved.slice(0, 5).map((a: any) => ({
          id: a.id,
          title: `Alert ready to publish: ${a.title}`,
          subtitle: `${a.pest_name} — ${a.severity} severity`,
          time: new Date(a.updated_at).toLocaleDateString(),
          icon: 'publish',
        })));
      } else if (user?.role === 'extension_officer') {
        const response = await validationApi.getQueue();
        const pending = (response.queue || []).filter(
          (v: any) => v.validation_status === 'pending' || v.validation_status === 'in_progress'
        );
        setPendingCount(pending.length);
        setNotifications(pending.slice(0, 5).map((v: any) => ({
          id: v.id,
          title: `Alert needs validation`,
          subtitle: v.pest_alert?.title || 'Untitled alert',
          time: new Date(v.created_at).toLocaleDateString(),
          icon: 'validate',
        })));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Agricultural Systems Coordinator';
      case 'extension_officer': return 'Extension Officer';
      case 'farmer': return 'Farmer';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'extension_officer': return 'bg-blue-100 text-blue-800';
      case 'farmer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isSidebarOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">Ghana Pest Alert</h1>
                <p className="text-xs text-gray-500">Agricultural Protection System</p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            {user && user.role !== 'farmer' && (
              <div className="relative">
                <button
                  onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsProfileOpen(false); }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <span className="text-xs text-gray-500">{pendingCount} pending</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                notif.icon === 'publish' ? 'bg-green-100' : 'bg-amber-100'
                              }`}>
                                {notif.icon === 'publish'
                                  ? <CheckCircle className="w-4 h-4 text-green-600" />
                                  : <AlertTriangle className="w-4 h-4 text-amber-600" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{notif.subtitle}</p>
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {notif.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          No new notifications
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-100">
                        <button
                          onClick={() => { loadNotifications(); setIsNotificationOpen(false); }}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Refresh notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationOpen(false); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{getRoleDisplay(user.role)}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplay(user.role)}
                      </span>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { setShowProfileModal(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" />
                        View Profile
                      </button>
                      <button
                        onClick={() => { setShowSettingsModal(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Click outside handler */}
        {(isProfileOpen || isNotificationOpen) && (
          <div className="fixed inset-0 z-30" onClick={() => { setIsProfileOpen(false); setIsNotificationOpen(false); }} />
        )}
      </header>

      {/* ── PROFILE MODAL ─────────────────────────────────────── */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowProfileModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-white">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold">{user.full_name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user.full_name}</h2>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white/20`}>
                    {getRoleDisplay(user.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{user.phone}</p>
                  </div>
                </div>
              )}
              {user.region && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium">
                      {[user.community, user.district, user.region].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-700">
                <Shield className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Account Status</p>
                  <p className="text-sm font-medium text-green-600">Active</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-sm font-medium">
                    {new Date(user.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL ────────────────────────────────────── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSettingsModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Notifications */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Notifications</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Email notifications', defaultOn: true },
                    { label: 'SMS alerts', defaultOn: true },
                    { label: 'Push notifications', defaultOn: false },
                  ].map((setting, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{setting.label}</span>
                      <div className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${
                        setting.defaultOn ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${
                          setting.defaultOn ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Display</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Language</span>
                    <select className="text-sm border border-gray-300 rounded-lg px-2 py-1 outline-none">
                      <option>English</option>
                      <option>Twi</option>
                      <option>Hausa</option>
                      <option>Ewe</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Region display</span>
                    <span className="text-sm font-medium text-gray-900">{user?.region || 'Not set'}</span>
                  </div>
                </div>
              </div>

              {/* Account */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Account</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Account ID</p>
                  <p className="text-sm font-mono text-gray-700 truncate">{user?.id}</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;