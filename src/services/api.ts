// ============================================================================
// API SERVICE LAYER
// Handles all API calls to Supabase database and edge functions
// Provides typed interfaces for all operations
// ============================================================================

import { supabase } from '@/lib/supabase';
import { 
  User, 
  Farmer, 
  ExtensionOfficer, 
  PestAlert, 
  ValidationQueueItem,
  Notification,
  GPTAnalysisResponse,
  SMSResponse,
  CreateAlertForm,
  RegisterFarmerForm
} from '@/types';

// ============================================================================
// AUTHENTICATION SERVICES
// ============================================================================

/**
 * Authenticate user with email and password
 * In production, this would use proper password hashing
 */
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    // Query the users table for matching credentials
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Login error:', error);
      return null;
    }

    // In production, verify password hash here
    // For demo, we accept any password
    return data as User;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

/**
 * Register a new user in the system
 */
export async function registerUser(userData: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        password_hash: 'hashed_password', // In production, hash the password
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return null;
    }

    return data as User;
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
}

// ============================================================================
// FARMER SERVICES
// ============================================================================

/**
 * Get all farmers with their user information
 */
export async function getAllFarmers(): Promise<Farmer[]> {
  try {
    const { data, error } = await supabase
      .from('farmers')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching farmers:', error);
      return [];
    }

    return data as Farmer[];
  } catch (error) {
    console.error('Error fetching farmers:', error);
    return [];
  }
}

/**
 * Register a new farmer with full profile
 */
export async function registerFarmer(farmerData: RegisterFarmerForm): Promise<Farmer | null> {
  try {
    // First create the user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        email: farmerData.email,
        password_hash: 'hashed_password', // In production, hash the password
        full_name: farmerData.full_name,
        phone: farmerData.phone,
        role: 'farmer',
        region: farmerData.region,
        district: farmerData.district,
        community: farmerData.community,
        is_active: true,
      }])
      .select()
      .single();

    if (userError || !userData) {
      console.error('Error creating user:', userError);
      return null;
    }

    // Then create the farmer profile
    const { data: farmerRecord, error: farmerError } = await supabase
      .from('farmers')
      .insert([{
        user_id: userData.id,
        farm_size_hectares: farmerData.farm_size_hectares,
        primary_crops: farmerData.primary_crops,
        sms_enabled: farmerData.sms_enabled,
        push_enabled: farmerData.push_enabled,
        language_preference: farmerData.language_preference,
      }])
      .select()
      .single();

    if (farmerError) {
      console.error('Error creating farmer profile:', farmerError);
      return null;
    }

    return { ...farmerRecord, user: userData } as Farmer;
  } catch (error) {
    console.error('Error registering farmer:', error);
    return null;
  }
}

/**
 * Update farmer information
 */
export async function updateFarmer(farmerId: string, updates: Partial<Farmer>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('farmers')
      .update(updates)
      .eq('id', farmerId);

    return !error;
  } catch (error) {
    console.error('Error updating farmer:', error);
    return false;
  }
}

/**
 * Delete a farmer (soft delete by deactivating)
 */
export async function deleteFarmer(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);

    return !error;
  } catch (error) {
    console.error('Error deleting farmer:', error);
    return false;
  }
}

// ============================================================================
// EXTENSION OFFICER SERVICES
// ============================================================================

/**
 * Get all extension officers
 */
export async function getAllExtensionOfficers(): Promise<ExtensionOfficer[]> {
  try {
    const { data, error } = await supabase
      .from('extension_officers')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching officers:', error);
      return [];
    }

    return data as ExtensionOfficer[];
  } catch (error) {
    console.error('Error fetching officers:', error);
    return [];
  }
}

// ============================================================================
// PEST ALERT SERVICES
// ============================================================================

/**
 * Get all pest alerts
 */
export async function getAllAlerts(): Promise<PestAlert[]> {
  try {
    const { data, error } = await supabase
      .from('pest_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }

    return data as PestAlert[];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

/**
 * Get published alerts only (for farmers)
 */
export async function getPublishedAlerts(): Promise<PestAlert[]> {
  try {
    const { data, error } = await supabase
      .from('pest_alerts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching published alerts:', error);
      return [];
    }

    return data as PestAlert[];
  } catch (error) {
    console.error('Error fetching published alerts:', error);
    return [];
  }
}

/**
 * Create a new pest alert
 */
export async function createAlert(alertData: CreateAlertForm, createdBy: string): Promise<PestAlert | null> {
  try {
    const { data, error } = await supabase
      .from('pest_alerts')
      .insert([{
        ...alertData,
        source: 'manual',
        status: 'pending',
        created_by: createdBy,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating alert:', error);
      return null;
    }

    return data as PestAlert;
  } catch (error) {
    console.error('Error creating alert:', error);
    return null;
  }
}

/**
 * Update alert status (approve, reject, publish)
 */
export async function updateAlertStatus(alertId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pest_alerts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', alertId);

    return !error;
  } catch (error) {
    console.error('Error updating alert status:', error);
    return false;
  }
}

/**
 * Update full alert content
 */
export async function updateAlert(alertId: string, updates: Partial<PestAlert>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pest_alerts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', alertId);

    return !error;
  } catch (error) {
    console.error('Error updating alert:', error);
    return false;
  }
}

// ============================================================================
// VALIDATION QUEUE SERVICES
// ============================================================================

/**
 * Get validation queue for an extension officer
 */
export async function getValidationQueue(officerId?: string): Promise<ValidationQueueItem[]> {
  try {
    let query = supabase
      .from('validation_queue')
      .select(`
        *,
        pest_alert:pest_alerts(*),
        assigned_officer:users(*)
      `)
      .order('created_at', { ascending: false });

    if (officerId) {
      query = query.eq('assigned_officer_id', officerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching validation queue:', error);
      return [];
    }

    return data as ValidationQueueItem[];
  } catch (error) {
    console.error('Error fetching validation queue:', error);
    return [];
  }
}

/**
 * Submit validation decision
 */
export async function submitValidation(
  validationId: string,
  decision: 'approved' | 'rejected',
  modifiedContent?: object,
  notes?: string,
  rejectionReason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('validation_queue')
      .update({
        validation_status: decision,
        modified_content: modifiedContent,
        officer_notes: notes,
        rejection_reason: rejectionReason,
        validated_at: new Date().toISOString(),
      })
      .eq('id', validationId);

    return !error;
  } catch (error) {
    console.error('Error submitting validation:', error);
    return false;
  }
}

// ============================================================================
// GPT ANALYSIS SERVICES
// ============================================================================

/**
 * Analyze pest using GPT (TEMP: no backend yet)
 * Returns a safe response so UI does not crash.
 */
export async function analyzePestWithGPT(
  analysisType: 'identify' | 'analyze' | 'recommend',
  pestName?: string,
  symptoms?: string,
  affectedCrops?: string[],
  region?: string
): Promise<GPTAnalysisResponse | null> {
  try {
    // No Edge Function call here.
    // Later, we will connect this to your real backend (Node/Python/OpenAI).
    return {
      success: true,
      analysisType,
      message: 'AI analysis is not configured yet. (Backend/OpenAI pending)',
      input: { pestName, symptoms, affectedCrops, region },
    } as any;
  } catch (error) {
    console.error('GPT analysis error:', error);
    return null;
  }
}


// ============================================================================
// SMS NOTIFICATION SERVICES
// ============================================================================

/**
* Send SMS to a single farmer (TEMP: no backend yet)
* For now, we only return a success-like response so the UI does not crash.
*/
export async function sendSingleSMS(phone: string, message: string): Promise<SMSResponse | null> {
 try {
   // No Edge Function call here.
   // Later, we will connect this to your real backend (Node/Python/Twilio).
   return {
     success: true,
     message: 'SMS sending is not configured yet. (Backend/Twilio pending)',
   } as any;
 } catch (error) {
   console.error('SMS error:', error);
   return null;
 }
}


/**
 * Send bulk SMS to multiple farmers (TEMP: no backend yet)
 */
export async function sendBulkSMS(
  recipients: Array<{ phone: string; name: string; farmerId: string }>,
  message: string,
  alertId?: string
): Promise<SMSResponse | null> {
  try {
    // No Edge Function call here.
    // Later, we will connect this to your real backend (Node/Python/Twilio).
    return {
      success: true,
      message: `Bulk SMS is not configured yet. Intended recipients: ${recipients.length}. (Backend/Twilio pending)`,
    } as any;
  } catch (error) {
    console.error('Bulk SMS error:', error);
    return null;
  }
}


// ============================================================================
// NOTIFICATION SERVICES
// ============================================================================

/**
 * Get notification history
 */
export async function getNotifications(userId?: string): Promise<Notification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        pest_alert:pest_alerts(*),
        recipient:users(*)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('recipient_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Record a notification in the database
 */
export async function recordNotification(notification: Partial<Notification>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([notification]);

    return !error;
  } catch (error) {
    console.error('Error recording notification:', error);
    return false;
  }
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

/**
 * Get dashboard statistics for admin
 */
export async function getDashboardStats(): Promise<{
  totalFarmers: number;
  totalOfficers: number;
  totalAlerts: number;
  pendingValidations: number;
  publishedAlerts: number;
}> {
  try {
    // Get farmer count
    const { count: farmerCount } = await supabase
      .from('farmers')
      .select('*', { count: 'exact', head: true });

    // Get officer count
    const { count: officerCount } = await supabase
      .from('extension_officers')
      .select('*', { count: 'exact', head: true });

    // Get alert counts
    const { count: alertCount } = await supabase
      .from('pest_alerts')
      .select('*', { count: 'exact', head: true });

    const { count: pendingCount } = await supabase
      .from('validation_queue')
      .select('*', { count: 'exact', head: true })
      .in('validation_status', ['pending', 'in_progress']);

    const { count: publishedCount } = await supabase
      .from('pest_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    return {
      totalFarmers: farmerCount || 0,
      totalOfficers: officerCount || 0,
      totalAlerts: alertCount || 0,
      pendingValidations: pendingCount || 0,
      publishedAlerts: publishedCount || 0,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalFarmers: 0,
      totalOfficers: 0,
      totalAlerts: 0,
      pendingValidations: 0,
      publishedAlerts: 0,
    };
  }
}
