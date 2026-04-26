// ============================================================================
// EXTENSION OFFICER MANAGEMENT COMPONENT
// Admin interface for managing extension officers
// Connected to Node.js backend
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  UserCheck, Plus, Search, Phone, Mail, MapPin,
  Trash2, X, CheckCircle, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { GHANA_REGIONS } from '@/types';
import { officersApi } from '@/services/backendApi';

const OfficerManagement: React.FC = () => {
  const [officers, setOfficers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    employee_id: '',
    region: '',
    district: '',
    community: '',
    assigned_regions: [] as string[],
  });

  useEffect(() => {
    loadOfficers();
  }, []);

  const loadOfficers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await officersApi.getAll();
      if (response.success) setOfficers(response.officers || []);
    } catch (err: any) {
      setError('Failed to load officers.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOfficers = officers.filter(officer => {
    const user = officer.user || {};
    return (
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_regions: prev.assigned_regions.includes(region)
        ? prev.assigned_regions.filter(r => r !== region)
        : [...prev.assigned_regions, region],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create');
    setError('');
    try {
      const response = await officersApi.create({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        employee_id: formData.employee_id,
        region: formData.region,
        district: formData.district,
        community: formData.community,
        assigned_regions: formData.assigned_regions,
      });

      if (response.success) {
        setSuccessMessage('Extension officer added successfully. They can now log in.');
        resetForm();
        await loadOfficers();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add officer.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (officerId: string) => {
    if (!confirm('Are you sure you want to remove this extension officer?')) return;
    setActionLoading(officerId);
    try {
      await officersApi.delete(officerId);
      setOfficers(prev => prev.filter(o => o.id !== officerId));
      setSuccessMessage('Officer removed successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError('Failed to remove officer.');
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '', email: '', phone: '', password: '',
      employee_id: '', region: '', district: '', community: '',
      assigned_regions: [],
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Extension Officers</h1>
          <p className="text-gray-500 mt-1">
            Manage extension officers who validate pest alerts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadOfficers}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Officer
          </button>
        </div>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search officers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{officers.length}</p>
          <p className="text-sm text-gray-500">Total Officers</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-green-600">
            {officers.filter(o => o.is_active).length}
          </p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-blue-600">
            {officers.reduce((sum, o) => sum + (o.validation_count || 0), 0)}
          </p>
          <p className="text-sm text-gray-500">Total Validations</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-purple-600">
            {new Set(officers.flatMap(o => o.assigned_regions || [])).size}
          </p>
          <p className="text-sm text-gray-500">Regions Covered</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-3 text-gray-500">Loading officers...</span>
        </div>
      )}

      {/* Officers grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOfficers.map(officer => (
            <div
              key={officer.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-lg">
                      {officer.user?.full_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {officer.user?.full_name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-500">{officer.employee_id || 'No ID'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  officer.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {officer.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {officer.user?.email || '-'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {officer.user?.phone || '-'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {officer.user?.district || '-'}, {officer.user?.region || '-'}
                </div>
              </div>

              {/* Assigned regions */}
              {(officer.assigned_regions || []).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Assigned Regions</p>
                  <div className="flex flex-wrap gap-1">
                    {(officer.assigned_regions || []).map((region: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {officer.validation_count || 0} validations
                </div>
                <button
                  onClick={() => handleDelete(officer.id)}
                  disabled={actionLoading === officer.id}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading === officer.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredOfficers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <UserCheck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No extension officers found</p>
          <p className="text-sm text-gray-400 mt-1">
            Click "Add Officer" to register a new extension officer
          </p>
        </div>
      )}

      {/* Add Officer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Extension Officer</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  The officer will be able to log in with their email and the password you set here.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Set login password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+233..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    placeholder="e.g. EXT-005"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">Select Region</option>
                    {GHANA_REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Community</label>
                  <input
                    type="text"
                    name="community"
                    value={formData.community}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              {/* Assigned regions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Regions
                </label>
                <div className="flex flex-wrap gap-2">
                  {GHANA_REGIONS.slice(0, 10).map(region => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.assigned_regions.includes(region)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'create'
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                    : 'Add Officer'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerManagement;