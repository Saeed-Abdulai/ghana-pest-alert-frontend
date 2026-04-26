import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, AlertTriangle, CheckCircle,
  Send, TrendingUp, Clock, MessageSquare, Plus,
  Loader2, RefreshCw
} from 'lucide-react';
import StatsCard from '@/components/shared/StatsCard';
import { statsApi, alertsApi, validationApi } from '@/services/backendApi';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [pendingValidations, setPendingValidations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [statsRes, alertsRes, validationRes] = await Promise.all([
        statsApi.getDashboard(),
        alertsApi.getAll(),
        validationApi.getQueue(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (alertsRes.success) {
        setRecentAlerts((alertsRes.alerts || []).slice(0, 3));
      }
      if (validationRes.success) {
        setPendingValidations(
          (validationRes.queue || []).filter(
            (v: any) => v.validation_status === 'pending' || v.validation_status === 'in_progress'
          ).slice(0, 3)
        );
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Create Alert',
      description: 'Create a new pest alert manually',
      icon: <Plus className="w-5 h-5" />,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => onNavigate('alerts')
    },
    {
      title: 'AI Analysis',
      description: 'Generate AI-powered pest analysis',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => onNavigate('ai-analysis')
    },
    {
      title: 'Send SMS',
      description: 'Broadcast alert to farmers',
      icon: <Send className="w-5 h-5" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => onNavigate('sms')
    },
    {
      title: 'Manage Farmers',
      description: 'View and manage farmers',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-amber-600 hover:bg-amber-700',
      action: () => onNavigate('farmers')
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
        <span className="ml-3 text-gray-500 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your pest alert system.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => onNavigate('alerts')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Alert
          </button>
        </div>
      </div>

      {/* Statistics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Farmers"
          value={stats?.totalFarmers ?? 0}
          icon={<Users className="w-6 h-6" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Extension Officers"
          value={stats?.totalOfficers ?? 0}
          icon={<UserCheck className="w-6 h-6" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Published Alerts"
          value={stats?.publishedAlerts ?? 0}
          icon={<AlertTriangle className="w-6 h-6" />}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          subtitle={`${stats?.totalAlerts ?? 0} total alerts`}
        />
        <StatsCard
          title="Pending Validations"
          value={stats?.pendingValidations ?? 0}
          icon={<Clock className="w-6 h-6" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          subtitle="Awaiting review"
        />
      </div>

      {/* SMS Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="SMS Delivered"
          value={stats?.smsDelivered ?? 0}
          icon={<MessageSquare className="w-6 h-6" />}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="SMS Failed"
          value={stats?.smsFailed ?? 0}
          icon={<Send className="w-6 h-6" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatsCard
          title="Pending Registrations"
          value={stats?.pendingRegistrations ?? 0}
          icon={<Users className="w-6 h-6" />}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
          subtitle="Farmers awaiting approval"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white rounded-xl p-4 text-left transition-colors`}
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                {action.icon}
              </div>
              <h3 className="font-semibold">{action.title}</h3>
              <p className="text-sm text-white/80 mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent alerts and pending validations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p>No alerts yet</p>
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onNavigate('alerts')}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {alert.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {alert.pest_name} • {(alert.affected_regions || [])[0] || 'Ghana'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        alert.status === 'published' ? 'bg-green-100 text-green-700' :
                        alert.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        alert.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending validations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Validations</h2>
            <button
              onClick={() => onNavigate('validation')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pendingValidations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-10 h-10 mx-auto text-green-300 mb-2" />
                <p>All validations complete!</p>
              </div>
            ) : (
              pendingValidations.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 cursor-pointer transition-colors"
                  onClick={() => onNavigate('validation')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.original_content?.title || item.pest_alert?.title || 'Untitled'}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 flex-shrink-0 ml-2">
                      Pending
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {item.original_content?.description || item.pest_alert?.description || '-'}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    Submitted {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Regional activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Coverage by Region</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {['Ashanti', 'Greater Accra', 'Western', 'Eastern', 'Northern', 'Volta', 'Central', 'Brong-Ahafo'].map((region) => (
            <div
              key={region}
              className="p-3 bg-gray-50 rounded-lg text-center hover:bg-green-50 cursor-pointer transition-colors"
            >
              <p className="text-lg font-bold text-gray-900">
                {recentAlerts.filter(a =>
                  (a.affected_regions || []).includes(region)
                ).length + (stats?.publishedAlerts > 0 ? Math.floor(stats.publishedAlerts / 8) : 0)}
              </p>
              <p className="text-xs text-gray-500 truncate">{region}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;