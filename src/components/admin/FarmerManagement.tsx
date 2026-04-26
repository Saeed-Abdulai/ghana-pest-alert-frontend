import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Filter, Phone, Mail,
  MapPin, Edit2, Trash2, X, Check, Clock,
  AlertCircle, Loader2, CheckCircle, XCircle,
  RefreshCw
} from 'lucide-react';
import { GHANA_REGIONS, GHANA_CROPS } from '@/types';
import { farmersApi } from '@/services/backendApi';

type TabType = 'farmers' | 'pending';

const FarmerManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('farmers');
  const [farmers, setFarmers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '',
    region: '', district: '', community: '',
    primary_crops: [] as string[],
    farm_size: '', sms_enabled: true, push_enabled: true
  });

  // Load farmers from backend
  const loadFarmers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await farmersApi.getAll();
      if (response.success) {
        setFarmers(response.farmers || []);
      }
    } catch (err: any) {
      setError('Failed to load farmers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load pending registration requests
  const loadPendingRequests = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await farmersApi.getPending();
      if (response.success) {
        setPendingRequests(response.requests || []);
      }
    } catch (err: any) {
      setError('Failed to load pending requests.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'farmers') {
      loadFarmers();
    } else {
      loadPendingRequests();
    }
  }, [activeTab]);

  // Approve farmer registration
  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const response = await farmersApi.approve(requestId);
      if (response.success) {
        setSuccessMessage('Farmer approved successfully. They can now log in.');
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setError('Failed to approve farmer.');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject farmer registration
  const handleReject = async (requestId: string) => {
    const reason = prompt('Please enter a reason for rejection:');
    if (!reason) return;

    setActionLoading(requestId);
    try {
      const response = await farmersApi.reject(requestId, reason);
      if (response.success) {
        setSuccessMessage('Registration request rejected.');
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setError('Failed to reject request.');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete/deactivate farmer
  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this farmer?')) return;
    try {
      await farmersApi.delete(userId);
      setFarmers(prev => prev.filter(f => f.user?.id !== userId));
      setSuccessMessage('Farmer deactivated successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError('Failed to deactivate farmer.');
    }
  };

  // Handle crop toggle in form
  const handleCropToggle = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      primary_crops: prev.primary_crops.includes(crop)
        ? prev.primary_crops.filter(c => c !== crop)
        : [...prev.primary_crops, crop]
    }));
  };

  // Filter farmers
  const filteredFarmers = farmers.filter(farmer => {
    const user = farmer.user || {};
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    const matchesRegion = regionFilter === 'all' || user.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmer Management</h1>
          <p className="text-gray-500 mt-1">
            Manage registered farmers and approve registration requests
          </p>
        </div>
        <button
          onClick={() => activeTab === 'farmers' ? loadFarmers() : loadPendingRequests()}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('farmers')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'farmers'
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Registered Farmers
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
              {farmers.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Approvals
            {pendingRequests.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-3 text-gray-500">Loading...</span>
        </div>
      )}

      {/* ── REGISTERED FARMERS TAB ── */}
      {activeTab === 'farmers' && !isLoading && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none appearance-none bg-white"
              >
                <option value="all">All Regions</option>
                {GHANA_REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{farmers.length}</p>
              <p className="text-sm text-gray-500">Total Farmers</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-2xl font-bold text-green-600">
                {farmers.filter(f => f.user?.is_active).length}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-2xl font-bold text-blue-600">
                {farmers.filter(f => f.sms_enabled).length}
              </p>
              <p className="text-sm text-gray-500">SMS Enabled</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-2xl font-bold text-purple-600">
                {farmers.filter(f => f.push_enabled).length}
              </p>
              <p className="text-sm text-gray-500">Push Enabled</p>
            </div>
          </div>

          {/* Farmers table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Farmer</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Contact</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Location</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Crops</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFarmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-700 font-semibold">
                              {farmer.user?.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {farmer.user?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {farmer.farm_size_hectares} hectares
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {farmer.user?.phone || '-'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="w-4 h-4" />
                            {farmer.user?.email || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {farmer.user?.community}, {farmer.user?.region}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(farmer.primary_crops || []).slice(0, 2).map((crop: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                              {crop}
                            </span>
                          ))}
                          {(farmer.primary_crops || []).length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{farmer.primary_crops.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          farmer.user?.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {farmer.user?.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(farmer.user?.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredFarmers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No farmers found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── PENDING APPROVALS TAB ── */}
      {activeTab === 'pending' && !isLoading && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-3" />
              <p className="text-gray-500 font-medium">No pending requests</p>
              <p className="text-gray-400 text-sm mt-1">
                All farmer registration requests have been reviewed
              </p>
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl border border-amber-200 p-6 space-y-4"
              >
                {/* Request header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-700 font-bold text-lg">
                        {request.full_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.full_name}</h3>
                      <p className="text-sm text-gray-500">{request.email}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                </div>

                {/* Request details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{request.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Region</p>
                    <p className="text-sm font-medium text-gray-900">{request.region || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Farm Size</p>
                    <p className="text-sm font-medium text-gray-900">
                      {request.farm_size_hectares ? `${request.farm_size_hectares} ha` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Submitted</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Crops */}
                {request.primary_crops?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Primary Crops</p>
                    <div className="flex flex-wrap gap-1">
                      {request.primary_crops.map((crop: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                          {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={actionLoading === request.id}
                    className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={actionLoading === request.id}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FarmerManagement;