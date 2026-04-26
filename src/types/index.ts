// ============================================================================
// TYPE DEFINITIONS FOR GHANA PEST ALERT SYSTEM
// These interfaces define the data structures used throughout the application
// ============================================================================

// User roles for role-based access control
export type UserRole = 'admin' | 'extension_officer' | 'farmer';

// Severity levels for pest alerts
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Status of pest alerts in the workflow
export type AlertStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'published';

// Validation status for human-in-the-loop workflow
export type ValidationStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'needs_revision';

// Notification delivery status
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';

// Source of pest alert data
export type AlertSource = 'ai_generated' | 'manual' | 'field_report' | 'external_source';

// Trusted external source organizations
export type ExternalSourceOrg =
  | 'MOFA'
  | 'EPA Ghana'
  | 'CSIR'
  | 'SARI'
  | 'FAO'
  | 'CABI'
  | 'Field Report'
  | 'Other';

export const EXTERNAL_SOURCE_ORGS: ExternalSourceOrg[] = 
[
  'MOFA',
  'EPA Ghana',
  'CSIR',
  'SARI',
  'FAO',
  'CABI',
  'Field Report',
  'Other',
];

// ============================================================================
// USER INTERFACES
// ============================================================================

// Base user interface for all user types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  region?: string;
  district?: string;
  community?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Extended farmer information
export interface Farmer {
  id: string;
  user_id: string;
  user?: User;
  farm_size_hectares?: number;
  primary_crops: string[];
  secondary_crops?: string[];
  gps_latitude?: number;
  gps_longitude?: number;
  sms_enabled: boolean;
  push_enabled: boolean;
  language_preference: string;
  assigned_extension_officer_id?: string;
  created_at: string;
}

// Extension officer information
export interface ExtensionOfficer {
  id: string;
  user_id: string;
  user?: User;
  employee_id: string;
  specialization: string[];
  assigned_regions: string[];
  validation_count: number;
  created_at: string;
}

export interface CreateExternalAlertForm {
  title: string;
  pest_name: string;
  affected_crops: string[];
  severity: AlertSeverity;
  description: string;
  symptoms: string;
  preventive_measures: string;
  control_measures: string;
  affected_regions: string[];
  image_url?: string;
  // External source specific fields
  source_organization: ExternalSourceOrg;
  source_reference?: string;   // e.g. URL, document title, bulletin number
  source_date?: string;        // date the source published it
  officer_name?: string;       // for field reports: name of reporting officer
}

// ============================================================================
// PEST ALERT INTERFACES
// ============================================================================

// Main pest alert structure
export interface PestAlert {
  id: string;
  title: string;
  pest_name: string;
  affected_crops: string[];
  severity: AlertSeverity;
  description: string;
  symptoms?: string;
  preventive_measures?: string;
  control_measures?: string;
  affected_regions: string[];
  image_url?: string;
  source: AlertSource;
  ai_confidence_score?: number;
  status: AlertStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Validation queue item for human-in-the-loop workflow
export interface ValidationQueueItem {
  id: string;
  pest_alert_id: string;
  pest_alert?: PestAlert;
  assigned_officer_id?: string;
  assigned_officer?: User;
  original_content: {
    title: string;
    description: string;
    symptoms: string;
    preventive_measures: string;
    control_measures: string;
  };
  modified_content?: {
    title: string;
    description: string;
    symptoms: string;
    preventive_measures: string;
    control_measures: string;
  };
  validation_status: ValidationStatus;
  officer_notes?: string;
  rejection_reason?: string;
  validated_at?: string;
  created_at: string;
}

// ============================================================================
// NOTIFICATION INTERFACES
// ============================================================================

// Notification record
export interface Notification {
  id: string;
  pest_alert_id?: string;
  pest_alert?: PestAlert;
  recipient_id: string;
  recipient?: User;
  notification_type: 'sms' | 'push' | 'both';
  message_content: string;
  sms_sid?: string;
  delivery_status: DeliveryStatus;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  created_at: string;
}

// Push subscription for web push notifications
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

// GPT analysis response
export interface GPTAnalysisResponse {
  success: boolean;
  analysisType: 'identify' | 'analyze' | 'recommend';
  pestName: string;
  affectedCrops?: string[];
  region?: string;
  generatedContent: string;
  confidenceScore: number;
  source: 'ai_generated';
  timestamp: string;
  requiresValidation: boolean;
  validationMessage: string;
}

// SMS sending response
export interface SMSResponse {
  success: boolean;
  action: string;
  totalRecipients?: number;
  successCount?: number;
  failureCount?: number;
  results?: Array<{
    success: boolean;
    recipientPhone: string;
    messageSid?: string;
    status?: string;
    error?: string;
  }>;
  timestamp: string;
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export interface DashboardStats {
  totalFarmers: number;
  activeFarmers: number;
  totalOfficers: number;
  totalAlerts: number;
  pendingValidations: number;
  publishedAlerts: number;
  smsDelivered: number;
  smsFailed: number;
}

// ============================================================================
// FORM INTERFACES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterFarmerForm {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  region: string;
  district: string;
  community: string;
  farm_size_hectares?: number;
  primary_crops: string[];
  sms_enabled: boolean;
  push_enabled: boolean;
  language_preference: string;
}

export interface CreateAlertForm {
  title: string;
  pest_name: string;
  affected_crops: string[];
  severity: AlertSeverity;
  description: string;
  symptoms: string;
  preventive_measures: string;
  control_measures: string;
  affected_regions: string[];
  image_url?: string;
}

// Ghana regions for dropdowns
export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Upper East',
  'Upper West',
  'Volta',
  'Brong-Ahafo',
  'Western North',
  'Ahafo',
  'Bono East',
  'Oti',
  'North East',
  'Savannah'
] as const;

// Common crops in Ghana
export const GHANA_CROPS = [
  'Maize',
  'Cassava',
  'Rice',
  'Cocoa',
  'Oil Palm',
  'Plantain',
  'Yam',
  'Groundnut',
  'Cowpea',
  'Tomato',
  'Pepper',
  'Onion',
  'Mango',
  'Citrus',
  'Pineapple',
  'Sorghum',
  'Millet',
  'Sweet Potato',
  'Coconut',
  'Cashew'
] as const;

// Common pests in Ghana
export const COMMON_PESTS = [
  'Fall Armyworm',
  'Stem Borers',
  'Aphids',
  'Grasshoppers',
  'Termites',
  'Weevils',
  'Fruit Flies',
  'Mealybugs',
  'Spider Mites',
  'Whiteflies',
  'Thrips',
  'Leaf Miners',
  'Root-Knot Nematodes',
  'Cassava Green Mite',
  'Larger Grain Borer',
  'Cocoa Mirids',
  'Pod Borers'
] as const;
