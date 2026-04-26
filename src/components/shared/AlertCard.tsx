// ============================================================================
// ALERT CARD COMPONENT
// Displays a pest alert in a card format
// Shows severity, affected crops, regions, and status
// ============================================================================

import React from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Leaf, 
  Clock, 
  Bot,
  FileText,
  Users
} from 'lucide-react';
import { PestAlert } from '@/types';

interface AlertCardProps {
  alert: PestAlert;
  onClick?: () => void;
  showActions?: boolean;
  onPublish?: () => void;
  onEdit?: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ 
  alert, 
  onClick,
  showActions = false,
  onPublish,
  onEdit
}) => {
  // Get severity color and label
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { 
          bg: 'bg-red-100', 
          text: 'text-red-700', 
          border: 'border-red-200',
          label: 'Critical'
        };
      case 'high':
        return { 
          bg: 'bg-orange-100', 
          text: 'text-orange-700', 
          border: 'border-orange-200',
          label: 'High'
        };
      case 'medium':
        return { 
          bg: 'bg-amber-100', 
          text: 'text-amber-700', 
          border: 'border-amber-200',
          label: 'Medium'
        };
      case 'low':
        return { 
          bg: 'bg-green-100', 
          text: 'text-green-700', 
          border: 'border-green-200',
          label: 'Low'
        };
      default:
        return { 
          bg: 'bg-gray-100', 
          text: 'text-gray-700', 
          border: 'border-gray-200',
          label: 'Unknown'
        };
    }
  };

  // Get status badge config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'published':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Published' };
      case 'approved':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Approved' };
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' };
      case 'under_review':
        return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Under Review' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  // Get source icon
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ai_generated':
        return <Bot className="w-3.5 h-3.5" />;
      case 'manual':
        return <FileText className="w-3.5 h-3.5" />;
      case 'field_report':
        return <Users className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const severityConfig = getSeverityConfig(alert.severity);
  const statusConfig = getStatusConfig(alert.status);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div 
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Image section */}
      {alert.image_url && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={alert.image_url}
            alt={alert.pest_name}
            className="w-full h-full object-cover"
          />
          {/* Severity badge overlay */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${severityConfig.bg} ${severityConfig.text}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {severityConfig.label}
            </span>
          </div>
          {/* AI confidence score */}
          {alert.source === 'ai_generated' && alert.ai_confidence_score && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                <Bot className="w-3.5 h-3.5 text-purple-600" />
                {alert.ai_confidence_score}% AI
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content section */}
      <div className="p-4">
        {/* Title and status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2">
            {alert.title}
          </h3>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Pest name */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {alert.description}
        </p>

        {/* Affected crops */}
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="w-4 h-4 text-green-600 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {alert.affected_crops.slice(0, 3).map((crop, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full"
              >
                {crop}
              </span>
            ))}
            {alert.affected_crops.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{alert.affected_crops.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Affected regions */}
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {alert.affected_regions.slice(0, 2).map((region, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {region}
              </span>
            ))}
            {alert.affected_regions.length > 2 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{alert.affected_regions.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Footer with date and source */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            {formatDate(alert.created_at)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {getSourceIcon(alert.source)}
            <span className="capitalize">{alert.source.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Action buttons (for admin) */}
        {showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            {alert.status === 'approved' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish?.();
                }}
                className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Publish Alert
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
