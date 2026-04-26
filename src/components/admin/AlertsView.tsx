// ============================================================================
// ALERTS VIEW COMPONENT
// Admin view for managing all pest alerts
// Includes filtering, status management, alert creation and external alerts
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, AlertTriangle, Send, X,
  Globe, Bot, FileText, Users, AlertCircle,
  CheckCircle, Loader2, RefreshCw, ImagePlus
} from 'lucide-react';
import AlertCard from '@/components/shared/AlertCard';
import { GHANA_REGIONS, GHANA_CROPS, COMMON_PESTS, EXTERNAL_SOURCE_ORGS, ExternalSourceOrg } from '@/types';
import { alertsApi, validationApi, officersApi } from '@/services/backendApi';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

const AlertsView: React.FC = () => {
  const { user } = useAuthStore();

  // Data state
  const [alerts, setAlerts] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningAlert, setAssigningAlert] = useState<any | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Image upload state — shared across all alert types
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploading, setImageUploading] = useState(false);

  // Manual alert form
  const [formData, setFormData] = useState({
    title: '',
    pest_name: '',
    affected_crops: [] as string[],
    severity: 'medium' as const,
    description: '',
    symptoms: '',
    preventive_measures: '',
    control_measures: '',
    affected_regions: [] as string[]
  });

  // External alert form
  const [externalFormData, setExternalFormData] = useState({
    title: '',
    pest_name: '',
    affected_crops: [] as string[],
    severity: 'medium' as const,
    description: '',
    symptoms: '',
    preventive_measures: '',
    control_measures: '',
    affected_regions: [] as string[],
    source_organization: '' as ExternalSourceOrg | '',
    source_reference: '',
    source_date: '',
    officer_name: ''
  });

  // ── Load data ──────────────────────────────────────────────────────
  useEffect(() => {
    loadAlerts();
    loadOfficers();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await alertsApi.getAll();
      if (response.success) setAlerts(response.alerts || []);
    } catch (err: any) {
      setError('Failed to load alerts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfficers = async () => {
    try {
      const response = await officersApi.getAll();
      if (response.success) setOfficers(response.officers || []);
    } catch (err) {
      console.error('Failed to load officers');
    }
  };

  // ── Image upload helpers ───────────────────────────────────────────
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `alert-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('alert-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw new Error('Failed to upload image');
    const { data: urlData } = supabase.storage
      .from('alert-images')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  // Reusable image upload UI block
  const renderImageUpload = (borderColor: string = 'green') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <ImagePlus className="w-4 h-4" />
        Alert Image (Optional)
      </label>
      {imagePreview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-1.5">
            <p className="text-white text-xs truncate">{imageFile?.name}</p>
          </div>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-${borderColor}-400 hover:bg-${borderColor}-50 transition-colors`}>
          <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Click to upload a pest image</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
      )}
      {imageUploading && (
        <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Uploading image to storage...
        </div>
      )}
    </div>
  );

  // ── Filtering ──────────────────────────────────────────────────────
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.pest_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesSource = sourceFilter === 'all' || alert.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSeverity && matchesSource;
  });

  const statusCounts = {
    all: alerts.length,
    pending: alerts.filter(a => a.status === 'pending').length,
    under_review: alerts.filter(a => a.status === 'under_review').length,
    approved: alerts.filter(a => a.status === 'approved').length,
    published: alerts.filter(a => a.status === 'published').length,
    rejected: alerts.filter(a => a.status === 'rejected').length
  };

  // ── Form handlers ──────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExternalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExternalFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCrop = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      affected_crops: prev.affected_crops.includes(crop)
        ? prev.affected_crops.filter(c => c !== crop)
        : [...prev.affected_crops, crop]
    }));
  };

  const toggleExternalCrop = (crop: string) => {
    setExternalFormData(prev => ({
      ...prev,
      affected_crops: prev.affected_crops.includes(crop)
        ? prev.affected_crops.filter(c => c !== crop)
        : [...prev.affected_crops, crop]
    }));
  };

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      affected_regions: prev.affected_regions.includes(region)
        ? prev.affected_regions.filter(r => r !== region)
        : [...prev.affected_regions, region]
    }));
  };

  const toggleExternalRegion = (region: string) => {
    setExternalFormData(prev => ({
      ...prev,
      affected_regions: prev.affected_regions.includes(region)
        ? prev.affected_regions.filter(r => r !== region)
        : [...prev.affected_regions, region]
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '', pest_name: '', affected_crops: [],
      severity: 'medium', description: '', symptoms: '',
      preventive_measures: '', control_measures: '', affected_regions: []
    });
    removeImage();
  };

  const resetExternalForm = () => {
    setExternalFormData({
      title: '', pest_name: '', affected_crops: [],
      severity: 'medium', description: '', symptoms: '',
      preventive_measures: '', control_measures: '', affected_regions: [],
      source_organization: '', source_reference: '', source_date: '', officer_name: ''
    });
    removeImage();
  };

  // ── API actions ────────────────────────────────────────────────────
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        setImageUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (imgErr) {
          setError('Failed to upload image. Alert not created.');
          setIsLoading(false);
          setImageUploading(false);
          return;
        }
        setImageUploading(false);
      }
      const response = await alertsApi.create({
        ...formData,
        source: 'manual',
        ...(imageUrl && { image_url: imageUrl }),
      });
      if (response.success) {
        setSuccessMessage('Alert created and added to validation queue.');
        setAlerts(prev => [response.alert, ...prev]);
        setShowCreateModal(false);
        resetForm();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setError('Failed to create alert. Please try again.');
    } finally {
      setIsLoading(false);
      setImageUploading(false);
    }
  };

  const handleCreateExternalAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        setImageUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (imgErr) {
          setError('Failed to upload image. Alert not created.');
          setIsLoading(false);
          setImageUploading(false);
          return;
        }
        setImageUploading(false);
      }
      const response = await alertsApi.create({
        title: externalFormData.title,
        pest_name: externalFormData.pest_name,
        affected_crops: externalFormData.affected_crops,
        severity: externalFormData.severity,
        description: externalFormData.description,
        symptoms: externalFormData.symptoms,
        preventive_measures: externalFormData.preventive_measures,
        control_measures: externalFormData.control_measures,
        affected_regions: externalFormData.affected_regions,
        source: 'external_source',
        source_organization: externalFormData.source_organization,
        source_reference: externalFormData.source_reference,
        source_date: externalFormData.source_date,
        ...(imageUrl && { image_url: imageUrl }),
      });
      if (response.success) {
        setSuccessMessage('External alert published immediately to farmers.');
        setAlerts(prev => [response.alert, ...prev]);
        setShowExternalModal(false);
        resetExternalForm();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setError('Failed to publish external alert.');
    } finally {
      setIsLoading(false);
      setImageUploading(false);
    }
  };

  const updateStatus = async (alertId: string, newStatus: string) => {
    try {
      if (newStatus === 'published') {
        await alertsApi.publish(alertId);
      } else {
        await alertsApi.update(alertId, { status: newStatus });
      }
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: newStatus as any, updated_at: new Date().toISOString() }
          : alert
      ));
      setSuccessMessage(`Alert ${newStatus} successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError('Failed to update alert status.');
    }
  };

  const handleAssignOfficer = async () => {
    if (!assigningAlert || !selectedOfficerId) return;
    setAssignLoading(true);
    try {
      const queueResponse = await validationApi.getQueue();
      const queueItem = queueResponse.queue?.find(
        (q: any) => q.pest_alert_id === assigningAlert.id
      );
      if (queueItem) {
        await validationApi.assign(queueItem.id, selectedOfficerId);
        setSuccessMessage('Alert assigned to officer successfully. They can now review it.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Could not find this alert in the validation queue.');
      }
      setShowAssignModal(false);
      setAssigningAlert(null);
      setSelectedOfficerId('');
    } catch (err) {
      setError('Failed to assign officer.');
    } finally {
      setAssignLoading(false);
    }
  };

  // ── Source badge ───────────────────────────────────────────────────
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ai_generated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            <Bot className="w-3 h-3" /> AI Generated
          </span>
        );
      case 'external_source':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            <Globe className="w-3 h-3" /> External Source
          </span>
        );
      case 'field_report':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            <Users className="w-3 h-3" /> Field Report
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
            <FileText className="w-3 h-3" /> Manual
          </span>
        );
    }
  };

  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">

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

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pest Alerts</h1>
          <p className="text-gray-500 mt-1">Manage and publish pest alerts for farmers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAlerts}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => setShowExternalModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Globe className="w-5 h-5" />
                External Source
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Alert
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-3 text-gray-500">Loading alerts...</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
        >
          <option value="all">All Status ({statusCounts.all})</option>
          <option value="pending">Pending ({statusCounts.pending})</option>
          <option value="under_review">Under Review ({statusCounts.under_review})</option>
          <option value="approved">Approved ({statusCounts.approved})</option>
          <option value="published">Published ({statusCounts.published})</option>
          <option value="rejected">Rejected ({statusCounts.rejected})</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
        >
          <option value="all">All Sources</option>
          <option value="ai_generated">AI Generated</option>
          <option value="external_source">External Source</option>
          <option value="field_report">Field Report</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'published'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === status
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
              {statusCounts[status as keyof typeof statusCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Alerts grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlerts.map(alert => (
            <div key={alert.id} className="relative">
              <AlertCard alert={alert} onClick={() => setSelectedAlert(alert)} />
              <div className="absolute top-3 left-3">
                {getSourceBadge(alert.source)}
              </div>
              {alert.status === 'approved' && user?.role === 'admin' && (
                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(alert.id, 'published');
                    }}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Publish"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredAlerts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No alerts found matching your criteria</p>
        </div>
      )}

      {/* ================================================================
          EXTERNAL SOURCE ALERT MODAL
      ================================================================ */}
      {showExternalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowExternalModal(false); removeImage(); }} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Add External Source Alert
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Alerts from trusted sources are published immediately without validation
                </p>
              </div>
              <button onClick={() => { setShowExternalModal(false); removeImage(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateExternalAlert} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-blue-800">Source Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Organisation <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="source_organization"
                      value={externalFormData.source_organization}
                      onChange={handleExternalInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">Select organisation...</option>
                      {EXTERNAL_SOURCE_ORGS.map(org => (
                        <option key={org} value={org}>{org}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Date</label>
                    <input
                      type="date"
                      name="source_date"
                      value={externalFormData.source_date}
                      onChange={handleExternalInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference / URL / Bulletin Number</label>
                    <input
                      type="text"
                      name="source_reference"
                      value={externalFormData.source_reference}
                      onChange={handleExternalInputChange}
                      placeholder="e.g. https://mofa.gov.gh/alert/2024 or Bulletin No. 12"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  {externalFormData.source_organization === 'Field Report' && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reporting Officer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="officer_name"
                        value={externalFormData.officer_name}
                        onChange={handleExternalInputChange}
                        placeholder="Full name of the field officer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Title <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="title" value={externalFormData.title}
                    onChange={handleExternalInputChange} required
                    placeholder="e.g. FAO Warning: Locust Swarms Approaching Northern Ghana"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pest / Disease Name <span className="text-red-500">*</span>
                  </label>
                  <select name="pest_name" value={externalFormData.pest_name}
                    onChange={handleExternalInputChange} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="">Select pest...</option>
                    {COMMON_PESTS.map(pest => <option key={pest} value={pest}>{pest}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select name="severity" value={externalFormData.severity}
                    onChange={handleExternalInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea name="description" value={externalFormData.description}
                  onChange={handleExternalInputChange} required rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                <textarea name="symptoms" value={externalFormData.symptoms}
                  onChange={handleExternalInputChange} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Affected Crops</label>
                <div className="flex flex-wrap gap-2">
                  {GHANA_CROPS.slice(0, 10).map(crop => (
                    <button key={crop} type="button" onClick={() => toggleExternalCrop(crop)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        externalFormData.affected_crops.includes(crop) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>{crop}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Affected Regions</label>
                <div className="flex flex-wrap gap-2">
                  {GHANA_REGIONS.slice(0, 8).map(region => (
                    <button key={region} type="button" onClick={() => toggleExternalRegion(region)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        externalFormData.affected_regions.includes(region) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>{region}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preventive Measures</label>
                  <textarea name="preventive_measures" value={externalFormData.preventive_measures}
                    onChange={handleExternalInputChange} rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Control Measures</label>
                  <textarea name="control_measures" value={externalFormData.control_measures}
                    onChange={handleExternalInputChange} rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>

              {/* Image upload for external alert */}
              {renderImageUpload('blue')}

              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <Send className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">
                  This alert will be <strong>published immediately</strong> to farmers without going through the validation queue.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => { setShowExternalModal(false); resetExternalForm(); }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading || imageUploading}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {(isLoading || imageUploading)
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{imageUploading ? 'Uploading image...' : 'Publishing...'}</>
                    : <><Globe className="w-4 h-4" /> Publish External Alert</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
          MANUAL CREATE ALERT MODAL
      ================================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCreateModal(false); removeImage(); }} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create New Alert</h2>
              <button onClick={() => { setShowCreateModal(false); removeImage(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAlert} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alert Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required
                    placeholder="e.g., Fall Armyworm Outbreak in Ashanti Region"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pest/Disease Name</label>
                  <select name="pest_name" value={formData.pest_name} onChange={handleInputChange} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="">Select pest...</option>
                    {COMMON_PESTS.map(pest => <option key={pest} value={pest}>{pest}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select name="severity" value={formData.severity} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                <textarea name="symptoms" value={formData.symptoms} onChange={handleInputChange} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Affected Crops</label>
                <div className="flex flex-wrap gap-2">
                  {GHANA_CROPS.slice(0, 10).map(crop => (
                    <button key={crop} type="button" onClick={() => toggleCrop(crop)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.affected_crops.includes(crop) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>{crop}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Affected Regions</label>
                <div className="flex flex-wrap gap-2">
                  {GHANA_REGIONS.slice(0, 8).map(region => (
                    <button key={region} type="button" onClick={() => toggleRegion(region)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.affected_regions.includes(region) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>{region}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preventive Measures</label>
                  <textarea name="preventive_measures" value={formData.preventive_measures} onChange={handleInputChange} rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Control Measures</label>
                  <textarea name="control_measures" value={formData.control_measures} onChange={handleInputChange} rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>

              {/* Image upload for manual alert */}
              {renderImageUpload('green')}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  ⏳ This alert will be sent to the <strong>validation queue</strong> for review by an assigned extension officer before publishing.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading || imageUploading}
                  className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {(isLoading || imageUploading)
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{imageUploading ? 'Uploading image...' : 'Creating...'}</>
                    : 'Create Alert'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
          ALERT DETAIL MODAL
      ================================================================ */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedAlert(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            {selectedAlert.image_url && (
              <div className="relative h-48">
                <img src={selectedAlert.image_url} alt={selectedAlert.pest_name} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedAlert(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  selectedAlert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  selectedAlert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  selectedAlert.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {selectedAlert.severity.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  selectedAlert.status === 'published' ? 'bg-green-100 text-green-700' :
                  selectedAlert.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                  selectedAlert.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedAlert.status.toUpperCase()}
                </span>
                {getSourceBadge(selectedAlert.source)}
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedAlert.title}</h2>

              {/* Meta info */}
              <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-500">
                <span>🌿 {selectedAlert.pest_name}</span>
                {selectedAlert.source_organization && (
                  <span>🏢 {selectedAlert.source_organization}</span>
                )}
                {selectedAlert.published_at && (
                  <span>📅 Published: {new Date(selectedAlert.published_at).toLocaleDateString()}</span>
                )}
              </div>

              <p className="text-gray-600 mb-4">{selectedAlert.description}</p>

              {/* Affected crops */}
              {selectedAlert.affected_crops?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Affected Crops</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedAlert.affected_crops.map((crop: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected regions */}
              {selectedAlert.affected_regions?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Affected Regions</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedAlert.affected_regions.map((region: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedAlert.symptoms && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-1">Symptoms</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedAlert.symptoms}</p>
                </div>
              )}

              {selectedAlert.preventive_measures && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-1">Preventive Measures</h4>
                  <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg whitespace-pre-line">
                    {selectedAlert.preventive_measures}
                  </p>
                </div>
              )}

              {selectedAlert.control_measures && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-1">Control Measures</h4>
                  <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg whitespace-pre-line">
                    {selectedAlert.control_measures}
                  </p>
                </div>
              )}

              {/* External source info */}
              {selectedAlert.source === 'external_source' && selectedAlert.source_organization && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-1 text-sm">Source Information</h4>
                  <p className="text-xs text-blue-700">Organisation: {selectedAlert.source_organization}</p>
                  {selectedAlert.source_reference && (
                    <p className="text-xs text-blue-700">Reference: {selectedAlert.source_reference}</p>
                  )}
                  {selectedAlert.source_date && (
                    <p className="text-xs text-blue-700">Date: {selectedAlert.source_date}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                {/* Admin: pending alerts show waiting message + assign button */}
                {selectedAlert.status === 'pending' && user?.role === 'admin' && (
                  <div className="flex-1 space-y-2">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                      <p className="text-sm text-amber-700 font-medium">⏳ Awaiting Officer Validation</p>
                      <p className="text-xs text-amber-600 mt-1">
                        Assign this alert to an extension officer for review
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setAssigningAlert(selectedAlert);
                        setSelectedAlert(null);
                        setShowAssignModal(true);
                      }}
                      className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Assign to Officer
                    </button>
                  </div>
                )}

                {/* Admin: approved alerts can be published */}
                {selectedAlert.status === 'approved' && user?.role === 'admin' && (
                  <button
                    onClick={() => { updateStatus(selectedAlert.id, 'published'); setSelectedAlert(null); }}
                    className="flex-1 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                  >
                    Publish Alert
                  </button>
                )}

                <button
                  onClick={() => setSelectedAlert(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          ASSIGN OFFICER MODAL
      ================================================================ */}
      {showAssignModal && assigningAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAssignModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Assign to Extension Officer</h3>
            <p className="text-sm text-gray-500 mb-1">
              Select an officer to review:
            </p>
            <p className="text-sm font-medium text-gray-800 mb-4 p-2 bg-gray-50 rounded-lg">
              {assigningAlert.title}
            </p>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-xs text-blue-700">
                ℹ️ Only the assigned officer will be able to see and validate this alert.
              </p>
            </div>

            {officers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No extension officers available.</p>
                <p className="text-xs text-gray-400 mt-1">Add officers from the Extension Officers section.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {officers.map((officer: any) => (
                  <button
                    key={officer.id}
                    onClick={() => setSelectedOfficerId(officer.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedOfficerId === officer.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        {officer.user?.full_name || 'Unknown Officer'}
                      </p>
                      {selectedOfficerId === officer.id && (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {officer.user?.region} • {officer.validation_count || 0} validations completed
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedOfficerId(''); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignOfficer}
                disabled={!selectedOfficerId || assignLoading}
                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {assignLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</>
                  : 'Assign Officer'
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AlertsView;