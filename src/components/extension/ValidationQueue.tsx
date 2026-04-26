// ============================================================================
// VALIDATION QUEUE COMPONENT
// Extension officer interface for reviewing and validating alerts
// Connected to Node.js backend
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Edit3, Clock, Bot,
  AlertTriangle, Save, X, ChevronDown, ChevronUp,
  Loader2, RefreshCw, AlertCircle
} from 'lucide-react';
import { validationApi } from '@/services/backendApi';

const ValidationQueue: React.FC = () => {
  const [validationItems, setValidationItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<{
    title: string;
    description: string;
    symptoms: string;
    preventive_measures: string;
    control_measures: string;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load validation queue from backend
  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await validationApi.getQueue();
      if (response.success) {
        setValidationItems(response.queue || []);
      }
    } catch (err: any) {
      setError('Failed to load validation queue.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const startEditing = (item: any) => {
    setEditingItem(item.id);
    setEditedContent({
      title: item.original_content?.title || item.pest_alert?.title || '',
      description: item.original_content?.description || item.pest_alert?.description || '',
      symptoms: item.original_content?.symptoms || item.pest_alert?.symptoms || '',
      preventive_measures: item.original_content?.preventive_measures || item.pest_alert?.preventive_measures || '',
      control_measures: item.original_content?.control_measures || item.pest_alert?.control_measures || '',
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditedContent(null);
  };

  const saveEdits = (itemId: string) => {
    if (!editedContent) return;
    setValidationItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, modified_content: editedContent, validation_status: 'in_progress' }
        : item
    ));
    setEditingItem(null);
    setEditedContent(null);
  };

  // Approve validation
  const handleApprove = async (itemId: string) => {
    setActionLoading(itemId);
    try {
      const item = validationItems.find(i => i.id === itemId);
      const response = await validationApi.approve(itemId, {
        modified_content: item?.modified_content || null,
        officer_notes: notes || undefined,
      });

      if (response.success) {
        setSuccessMessage('Alert approved successfully. Admin can now publish it.');
        setValidationItems(prev => prev.map(i =>
          i.id === itemId
            ? { ...i, validation_status: 'approved', officer_notes: notes, validated_at: new Date().toISOString() }
            : i
        ));
        setNotes('');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setError('Failed to approve alert.');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject validation
  const handleReject = async (itemId: string) => {
    if (!rejectionReason.trim()) return;
    setActionLoading(itemId);
    try {
      const response = await validationApi.reject(itemId, {
        rejection_reason: rejectionReason,
        officer_notes: notes || undefined,
      });

      if (response.success) {
        setSuccessMessage('Alert rejected.');
        setValidationItems(prev => prev.map(i =>
          i.id === itemId
            ? { ...i, validation_status: 'rejected', rejection_reason: rejectionReason, validated_at: new Date().toISOString() }
            : i
        ));
        setShowRejectModal(null);
        setRejectionReason('');
        setNotes('');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setError('Failed to reject alert.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingItems = validationItems.filter(
    item => item.validation_status === 'pending' || item.validation_status === 'in_progress'
  );
  const completedItems = validationItems.filter(
    item => item.validation_status === 'approved' || item.validation_status === 'rejected'
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation Queue</h1>
          <p className="text-gray-500 mt-1">
            Review and validate pest alerts before publishing to farmers
          </p>
        </div>
        <button
          onClick={loadQueue}
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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-3 text-gray-500">Loading queue...</span>
        </div>
      )}

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-amber-600">{pendingItems.length}</p>
            <p className="text-sm text-gray-500">Pending Review</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-green-600">
              {completedItems.filter(i => i.validation_status === 'approved').length}
            </p>
            <p className="text-sm text-gray-500">Approved</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-red-600">
              {completedItems.filter(i => i.validation_status === 'rejected').length}
            </p>
            <p className="text-sm text-gray-500">Rejected</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{validationItems.length}</p>
            <p className="text-sm text-gray-500">Total Items</p>
          </div>
        </div>
      )}

      {/* Pending validations */}
      {!isLoading && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Validations ({pendingItems.length})
          </h2>

          {pendingItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-3" />
              <p className="text-gray-500">All validations are complete!</p>
              <p className="text-sm text-gray-400 mt-1">
                New alerts will appear here when created by admin.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingItems.map(item => {
                const alert = item.pest_alert;
                const isExpanded = expandedItem === item.id;
                const isEditing = editingItem === item.id;
                const content = editedContent || item.modified_content || item.original_content;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    {/* Header */}
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => !isEditing && toggleExpand(item.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {content?.title || alert?.title || 'Untitled Alert'}
                            </h3>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              {alert?.source === 'ai_generated' ? 'AI Generated' : 'Manual'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {alert?.pest_name} • {(alert?.affected_regions || []).join(', ')}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              item.validation_status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {item.validation_status === 'pending' ? 'Pending Review' : 'In Progress'}
                            </span>
                            <span className="text-xs text-gray-500">
                              Submitted: {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isEditing && (
                          isExpanded
                            ? <ChevronUp className="w-5 h-5 text-gray-400" />
                            : <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                              <input
                                type="text"
                                value={editedContent?.title || ''}
                                onChange={(e) => setEditedContent(prev => prev ? { ...prev, title: e.target.value } : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={editedContent?.description || ''}
                                onChange={(e) => setEditedContent(prev => prev ? { ...prev, description: e.target.value } : null)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                              <textarea
                                value={editedContent?.symptoms || ''}
                                onChange={(e) => setEditedContent(prev => prev ? { ...prev, symptoms: e.target.value } : null)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Preventive Measures</label>
                              <textarea
                                value={editedContent?.preventive_measures || ''}
                                onChange={(e) => setEditedContent(prev => prev ? { ...prev, preventive_measures: e.target.value } : null)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Control Measures</label>
                              <textarea
                                value={editedContent?.control_measures || ''}
                                onChange={(e) => setEditedContent(prev => prev ? { ...prev, control_measures: e.target.value } : null)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdits(item.id)}
                                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                              >
                                <Save className="w-4 h-4" />
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                              <p className="text-gray-600 text-sm">{content?.description || alert?.description}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">Symptoms</h4>
                              <p className="text-gray-600 text-sm">{content?.symptoms || alert?.symptoms || '-'}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">Preventive Measures</h4>
                              <p className="text-gray-600 text-sm whitespace-pre-line">
                                {content?.preventive_measures || alert?.preventive_measures || '-'}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">Control Measures</h4>
                              <p className="text-gray-600 text-sm whitespace-pre-line">
                                {content?.control_measures || alert?.control_measures || '-'}
                              </p>
                            </div>

                            {/* Severity badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Severity:</span>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                alert?.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                alert?.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                alert?.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {alert?.severity?.toUpperCase()}
                              </span>
                            </div>

                            {/* Officer notes */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Notes (Optional)
                              </label>
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes about this validation..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                              />
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                              <button
                                onClick={() => startEditing(item)}
                                className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                              >
                                <Edit3 className="w-4 h-4" />
                                Edit Content
                              </button>
                              <button
                                onClick={() => handleApprove(item.id)}
                                disabled={actionLoading === item.id}
                                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                              >
                                {actionLoading === item.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <CheckCircle className="w-4 h-4" />
                                }
                                Approve
                              </button>
                              <button
                                onClick={() => setShowRejectModal(item.id)}
                                disabled={actionLoading === item.id}
                                className="px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed validations */}
      {!isLoading && completedItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Completed Validations ({completedItems.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Alert</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Validated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {completedItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {item.original_content?.title || item.pest_alert?.title || '-'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.pest_alert?.pest_name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.validation_status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.validation_status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {item.validated_at
                        ? new Date(item.validated_at).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(null)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Alert</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for rejecting this alert.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectionReason.trim() || actionLoading === showRejectModal}
                className="flex-1 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === showRejectModal
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : 'Confirm Reject'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationQueue;