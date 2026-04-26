import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Bell, Leaf, MapPin,
  Shield, Clock, ChevronRight, Phone,
  X, Loader2, RefreshCw
} from 'lucide-react';
import { alertsApi } from '@/services/backendApi';
import { useAuthStore } from '@/store/authStore';

const FarmerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await alertsApi.getAll();
      if (response.success) {
        setAlerts(response.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const publishedAlerts = alerts.filter(a => {
    if (a.status !== 'published') return false;
  
    // Show all alerts if no region restrictions set
    if (!a.affected_regions || a.affected_regions.length === 0) return true;
  
    // Show if farmer has no region (show everything)
    if (!user?.region) return true;
  
    // Show if farmer's region is in affected regions
    return a.affected_regions.includes(user.region);
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {user?.full_name || 'Farmer'}!
            </h1>
            <p className="text-green-100 mt-1">
              Stay informed about pest alerts in your area
            </p>
            {user?.region && (
              <div className="flex items-center gap-2 mt-3 text-green-100">
                <MapPin className="w-4 h-4" />
                <span>{user.region}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Leaf className="w-8 h-8" />
            </div>
            <button
              onClick={loadAlerts}
              className="flex items-center gap-1 text-xs text-green-100 hover:text-white"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {publishedAlerts.filter(a => a.severity === 'critical').length}
              </p>
              <p className="text-xs text-gray-500">Critical Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {publishedAlerts.filter(a => a.severity === 'high').length}
              </p>
              <p className="text-xs text-gray-500">High Priority</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {publishedAlerts.length}
              </p>
              <p className="text-xs text-gray-500">Total Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {user?.region ? 1 : 0}
              </p>
              <p className="text-xs text-gray-500">Your Region</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active alerts */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Pest Alerts
          {publishedAlerts.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-sm rounded-full">
              {publishedAlerts.length}
            </span>
          )}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <span className="ml-3 text-gray-500">Loading alerts...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedAlerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              >
                {alert.image_url && (
                  <div className="relative h-40">
                    <img
                      src={alert.image_url}
                      alt={alert.pest_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {!alert.image_url && (
                  <div className="h-20 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{alert.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {alert.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(alert.affected_crops || []).slice(0, 3).map((crop: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                        {crop}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(alert.created_at)}
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && publishedAlerts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Shield className="w-12 h-12 mx-auto text-green-300 mb-3" />
            <p className="text-gray-500">No active pest alerts at the moment</p>
            <p className="text-sm text-gray-400 mt-1">
              You'll be notified when new alerts are published
            </p>
          </div>
        )}
      </div>

      {/* Emergency contact */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">Need Help?</h3>
            <p className="text-sm text-amber-700 mt-1">
              Contact your local extension officer for immediate assistance.
            </p>
            <button className="mt-3 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors">
              Contact Extension Officer
            </button>
          </div>
        </div>
      </div>

      {/* Alert detail modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedAlert(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            {selectedAlert.image_url && (
              <div className="relative h-48">
                <img
                  src={selectedAlert.image_url}
                  alt={selectedAlert.pest_name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getSeverityColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity.toUpperCase()} SEVERITY
                  </span>
                </div>
              </div>
            )}
            <div className="p-6">
              {!selectedAlert.image_url && (
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {selectedAlert.title}
              </h2>
              <p className="text-gray-600 mb-4">{selectedAlert.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Affected Crops</h4>
                  <div className="flex flex-wrap gap-1">
                    {(selectedAlert.affected_crops || []).map((crop: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Affected Regions</h4>
                  <div className="flex flex-wrap gap-1">
                    {(selectedAlert.affected_regions || []).map((region: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Source info for external alerts */}
{selectedAlert.source === 'external_source' && selectedAlert.source_organization && (
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <h4 className="text-sm font-semibold text-blue-800 mb-1">Source</h4>
    <p className="text-sm text-blue-700">Organisation: {selectedAlert.source_organization}</p>
    {selectedAlert.source_reference && (
      <p className="text-xs text-blue-600 mt-1">Ref: {selectedAlert.source_reference}</p>
    )}
    {selectedAlert.source_date && (
      <p className="text-xs text-blue-600">Date: {selectedAlert.source_date}</p>
    )}
  </div>
)}

              {selectedAlert.symptoms && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Symptoms</h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                    {selectedAlert.symptoms}
                  </p>
                </div>
              )}

              {selectedAlert.preventive_measures && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-1 text-green-600" />
                    Preventive Measures
                  </h4>
                  <div className="text-gray-600 text-sm bg-green-50 p-3 rounded-lg whitespace-pre-line">
                    {selectedAlert.preventive_measures}
                  </div>
                </div>
              )}

              {selectedAlert.control_measures && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-600" />
                    Control Measures
                  </h4>
                  <div className="text-gray-600 text-sm bg-amber-50 p-3 rounded-lg whitespace-pre-line">
                    {selectedAlert.control_measures}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedAlert(null)}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;