// ============================================================================
// SMS BROADCAST COMPONENT
// Admin interface for sending SMS alerts to farmers
// Connected to Node.js backend with Twilio integration
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Send, Users, Phone, MessageSquare, CheckCircle,
  XCircle, Loader2, AlertTriangle, Filter, Search, RefreshCw
} from 'lucide-react';
import { smsApi, farmersApi, alertsApi } from '@/services/backendApi';
import { GHANA_REGIONS, GHANA_CROPS } from '@/types';

const SMSBroadcast: React.FC = () => {
  const [message, setMessage] = useState('');
  const [selectedAlert, setSelectedAlert] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [farmers, setFarmers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
    details?: { sent: number; failed: number };
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [farmersRes, alertsRes] = await Promise.all([
        farmersApi.getAll(),
        alertsApi.getAll({ status: 'published' }),
      ]);
      if (farmersRes.success) setFarmers(farmersRes.farmers || []);
      if (alertsRes.success) setAlerts(alertsRes.alerts || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter farmers
  const filteredFarmers = farmers.filter(farmer => {
    const user = farmer.user || {};
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    const matchesRegion =
      selectedRegions.length === 0 || selectedRegions.includes(user.region);
    const matchesCrops =
      selectedCrops.length === 0 ||
      (farmer.primary_crops || []).some((crop: string) => selectedCrops.includes(crop));
    return matchesSearch && matchesRegion && matchesCrops;
  });

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const toggleCrop = (crop: string) => {
    setSelectedCrops(prev =>
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    );
  };

  const toggleFarmer = (farmerId: string) => {
    setSelectedFarmers(prev =>
      prev.includes(farmerId) ? prev.filter(f => f !== farmerId) : [...prev, farmerId]
    );
  };

  const selectAllFarmers = () => {
    setSelectedFarmers(filteredFarmers.map(f => f.id));
  };

  const clearSelections = () => {
    setSelectedFarmers([]);
  };

  const loadAlertMessage = (alertId: string) => {
    const alert = alerts.find((a: any) => a.id === alertId);
    if (alert) {
      const alertMessage =
        `PEST ALERT: ${alert.title}\n\n` +
        `Pest: ${alert.pest_name}\n` +
        `Severity: ${alert.severity?.toUpperCase()}\n` +
        `Affected Crops: ${(alert.affected_crops || []).join(', ')}\n\n` +
        `${alert.description}\n\n` +
        `- Ghana Pest Alert System`;
      setMessage(alertMessage);
    }
  };

  const handleSendSMS = async () => {
    if (!message.trim()) {
      setSendResult({ success: false, message: 'Please enter a message to send.' });
      return;
    }
    if (selectedFarmers.length === 0) {
      setSendResult({ success: false, message: 'Please select at least one farmer.' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const recipients = selectedFarmers.map(farmerId => {
        const farmer = farmers.find(f => f.id === farmerId);
        return {
          phone: farmer?.user?.phone || '',
          name: farmer?.user?.full_name || '',
          farmerId,
        };
      }).filter(r => r.phone);

      const response = await smsApi.send({
        recipients,
        message,
        alertId: selectedAlert || undefined,
      });

      if (response.success) {
        setSendResult({
          success: true,
          message: 'SMS broadcast completed successfully!',
          details: {
            sent: response.successCount || recipients.length,
            failed: response.failureCount || 0,
          },
        });
        setSelectedFarmers([]);
        setMessage('');
        setSelectedAlert('');
      } else {
        throw new Error(response.error || 'Failed to send SMS');
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || 'Failed to send SMS. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Broadcast</h1>
          <p className="text-gray-500 mt-1">
            Send pest alerts and notifications to farmers via SMS
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-3 text-gray-500">Loading farmers and alerts...</span>
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Load from alert */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Load from Published Alert (Optional)
              </h2>
              <select
                value={selectedAlert}
                onChange={(e) => {
                  setSelectedAlert(e.target.value);
                  if (e.target.value) loadAlertMessage(e.target.value);
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Select a published alert...</option>
                {alerts.map((alert: any) => (
                  <option key={alert.id} value={alert.id}>
                    {alert.title} ({alert.severity})
                  </option>
                ))}
              </select>
            </div>

            {/* Message composition */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Compose Message
              </h2>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={8}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
              />
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>{charCount} characters</span>
                <span>{smsCount} SMS message{smsCount > 1 ? 's' : ''} (160 chars/SMS)</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Filter Recipients
              </h2>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">By Region</p>
                <div className="flex flex-wrap gap-2">
                  {GHANA_REGIONS.slice(0, 8).map(region => (
                    <button
                      key={region}
                      onClick={() => toggleRegion(region)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedRegions.includes(region)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">By Crop</p>
                <div className="flex flex-wrap gap-2">
                  {GHANA_CROPS.slice(0, 8).map(crop => (
                    <button
                      key={crop}
                      onClick={() => toggleCrop(crop)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCrops.includes(crop)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Send result */}
            {sendResult && (
              <div className={`p-4 rounded-xl flex items-start gap-3 ${
                sendResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {sendResult.success
                  ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                }
                <div>
                  <p className={`font-medium ${
                    sendResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {sendResult.message}
                  </p>
                  {sendResult.details && (
                    <p className="text-sm text-green-700 mt-1">
                      Sent: {sendResult.details.sent} | Failed: {sendResult.details.failed}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Farmer selection */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Select Recipients
                </h2>
                <span className="text-sm text-gray-500">
                  {selectedFarmers.length} selected
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search farmers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllFarmers}
                  className="flex-1 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Select All ({filteredFarmers.length})
                </button>
                <button
                  onClick={clearSelections}
                  className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Farmer list */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredFarmers.map(farmer => (
                  <label
                    key={farmer.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFarmers.includes(farmer.id)
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFarmers.includes(farmer.id)}
                      onChange={() => toggleFarmer(farmer.id)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {farmer.user?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {farmer.user?.phone || '-'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">{farmer.user?.region}</span>
                  </label>
                ))}
              </div>

              {filteredFarmers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No farmers found</p>
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSendSMS}
              disabled={isSending || selectedFarmers.length === 0 || !message.trim()}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send SMS to {selectedFarmers.length} Farmer{selectedFarmers.length !== 1 ? 's' : ''}
                </>
              )}
            </button>

            {/* Cost estimate */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Estimated Cost</p>
                  <p className="text-xs text-amber-700 mt-1">
                    {selectedFarmers.length} recipients × {smsCount} SMS = ~{selectedFarmers.length * smsCount} messages
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Trial account: only verified numbers can receive SMS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSBroadcast;