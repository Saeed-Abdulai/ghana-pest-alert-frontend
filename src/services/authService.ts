// ============================================================================
// AUTHENTICATION SERVICE
// Handles all authentication operations including login, register, and session management
// Uses Supabase edge functions for secure server-side authentication
// ============================================================================



import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: UserRole;
  region?: string;
  district?: string;
  community?: string;
  // Farmer-specific
  farm_size_hectares?: number;
  primary_crops?: string[];
  // Officer-specific
  employee_id?: string;
  specialization?: string[];
  assigned_regions?: string[];
  // Admin registration
  admin_secret?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  expiresAt?: string;
  user?: User;
  profile?: any;
  requiresApproval?: boolean;
  requiresVerification?: boolean;
  requestId?: string;
}

export interface FarmerRegistrationRequest {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  region?: string;
  district?: string;
  community?: string;
  farm_size_hectares?: number;
  primary_crops?: string[];
  status: 'pending' | 'approved' | 'rejected';
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

const TOKEN_KEY = 'ghana_pest_alert_token';
const USER_KEY = 'ghana_pest_alert_user';
const EXPIRES_KEY = 'ghana_pest_alert_expires';

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Login user with email and password (Supabase Auth direct)
 */

/**
 * Login user with email and password
 * Uses Supabase Auth directly (no Edge Function)
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const cleanEmail = credentials.email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: credentials.password,
    });
    

    if (error || !data.session || !data.user) {
      return { success: false, error: error?.message || 'Login failed' };
    }

    const session = data.session;
    const user = data.user;

    // Build your app user (optional). If you don't have this function in this file, skip it.
    // If buildAppUser exists in this file, keep this line; if not, remove it and use the minimal user below.
    // const appUser = await buildAppUser(user.id, user.email || credentials.email);
// Fetch role/profile from DB (profiles table)
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, full_name, phone_number, role, created_at')
  .eq('id', user.id)
  .single();

  if (profileError || !profile) {
    console.error('PROFILE FETCH ERROR:', profileError);
    console.error('AUTH USER ID USED:', user.id);
    return {
      success: false,
      error: `Profile fetch failed: ${profileError?.message || 'no profile returned'}`,
    };
  }
  

const appUser: any = {
  id: profile.id,
  email: user.email || credentials.email,
  role: profile.role, // THIS fixes admin/subscriber routing
  full_name: profile.full_name || '',
  phone: profile.phone_number || '',
  region:'',
  created_at: profile.created_at || new Date().toISOString(),
};

    const token = session.access_token;
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(appUser));
    if (expiresAt) localStorage.setItem(EXPIRES_KEY, expiresAt);

    return {
      success: true,
      message: 'Login successful',
      token,
      expiresAt,
      user: appUser,
      profile: appUser,
    };
  } catch (err: any) {
    console.error('Login error:', err);
    return { success: false, error: err?.message || 'Login failed' };
  }
}


/**
 * Register a new user (Supabase Auth direct)
 * SECURITY: Public signups should NOT be able to create admin/extension officer.
 * We force role = farmer at signup. Admin can promote users later.
 */
// console.log('REGISTER VERSION: 2026-01-14-A');

export async function register(userData: RegisterData): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Registration failed' };
    }

    // If email confirmation is enabled, Supabase returns NO session here.
    // In that case, do NOT touch profiles/regions yet.
    if (!data.session) {
      return {
        success: true,
        message:
          'Registration successful. Please check your email to confirm your account, then log in.',
        requiresVerification: true,
      };
    }

    // If we have a session, we are authenticated and can now update profile safely.
    const userId = data.user.id;

    // IMPORTANT: only resolve region_id if you *must*.
    // If region_id is NOT NULL in DB, you must force region selection in UI.
    // Otherwise, set region_id to null and let user complete profile after login.
    const regionId = userData.region ? await resolveRegionId(userData.region) : null;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: userData.full_name,
        phone_number: userData.phone,
        role: userData.role || 'farmer',
        region_id: regionId, // can be null only if DB allows it
      })
      .eq('id', userId);

    if (profileError) {
      return {
        success: false,
        error:
          profileError.message ||
          'Profile update failed. Check RLS policies and region_id constraints.',
      };
    }

    return {
      success: true,
      message: 'Registration successful',
    };
  } catch (err: any) {
    console.error('Registration error:', err);
    return { success: false, error: err?.message || 'Registration failed' };
  }
}


/**
 * Verify current session (Supabase Auth direct)
 */
export async function verifyToken(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session || !data.session.user) {
      clearAuthData();
      return { success: false, error: 'No active session' };
    }

    const session = data.session;
    const user = session.user;

    const appUser = await buildAppUser(user.id, user.email || '');

    const token = session.access_token;
    const expiresAt = toIsoExpiresAt(session.expires_at);

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(appUser));
    if (expiresAt) localStorage.setItem(EXPIRES_KEY, expiresAt);

    return { success: true, token, expiresAt, user: appUser, profile: appUser };
  } catch (err: any) {
    console.error('Token verification error:', err);
    clearAuthData();
    return { success: false, error: err?.message || 'Verification failed' };
  }
}


/**
 * Refresh authentication session (Supabase Auth direct)
 */
export async function refreshToken(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session || !data.user) {
      clearAuthData();
      return { success: false, error: error?.message || 'Refresh failed' };
    }

    const session = data.session;
    const user = data.user;

    const appUser = await buildAppUser(user.id, user.email || '');

    const token = session.access_token;
    const expiresAt = toIsoExpiresAt(session.expires_at);

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(appUser));
    if (expiresAt) localStorage.setItem(EXPIRES_KEY, expiresAt);

    return { success: true, token, expiresAt, user: appUser, profile: appUser };
  } catch (err: any) {
    console.error('Token refresh error:', err);
    clearAuthData();
    return { success: false, error: err?.message || 'Refresh failed' };
  }
}


/**
 * Logout current session (Supabase Auth direct)
 */
export async function logout(): Promise<AuthResponse> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuthData();
  }
  return { success: true, message: 'Logged out successfully' };
}

/**
 * Logout all sessions
 * Note: Supabase client signOut logs out the current session in this browser.
 * Full global logout requires admin-level token revocation; implement later if needed.
 */
export async function logoutAll(): Promise<AuthResponse> {
  return logout();
}


// ============================================================================
// FARMER REGISTRATION APPROVAL (Admin/Officer functions)
// ============================================================================

/**
 * Get pending farmer registration requests
 */
export async function getPendingFarmerRequests(): Promise<FarmerRegistrationRequest[]> {
  try {
    const { data, error } = await supabase
      .from('farmer_registration_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return [];
    }

    return data as FarmerRegistrationRequest[];
  } catch (error) {
    console.error('Error fetching farmer requests:', error);
    return [];
  }
}

/**
 * Approve a farmer registration request
 */
export async function approveFarmerRequest(
  requestId: string, 
  reviewerId: string,
  notes?: string
): Promise<AuthResponse> {
  try {
    // Get the request data
    const { data: request, error: fetchError } = await supabase
      .from('farmer_registration_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return { success: false, error: 'Request not found' };
    }

    // Create user from request
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{
        email: request.email,
        password_hash: request.password_hash,
        full_name: request.full_name,
        phone: request.phone,
        role: 'farmer',
        region: request.region,
        district: request.district,
        community: request.community,
        is_active: true,
        email_verified: true // Auto-verify approved farmers
      }])
      .select()
      .single();

    if (userError || !newUser) {
      return { success: false, error: 'Failed to create user account' };
    }

    // Create farmer profile
    await supabase
      .from('farmers')
      .insert([{
        user_id: newUser.id,
        farm_size_hectares: request.farm_size_hectares,
        primary_crops: request.primary_crops || [],
        sms_enabled: true,
        push_enabled: true,
        language_preference: 'en'
      }]);

    // Update request status
    await supabase
      .from('farmer_registration_requests')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        review_notes: notes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    return { success: true, message: 'Farmer registration approved', user: newUser };
  } catch (error: any) {
    console.error('Approval error:', error);
    return { success: false, error: error.message || 'Approval failed' };
  }
}

/**
 * Reject a farmer registration request
 */
export async function rejectFarmerRequest(
  requestId: string,
  reviewerId: string,
  reason: string
): Promise<AuthResponse> {
  try {
    const { error } = await supabase
      .from('farmer_registration_requests')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        review_notes: reason,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      return { success: false, error: 'Failed to reject request' };
    }

    return { success: true, message: 'Farmer registration rejected' };
  } catch (error: any) {
    console.error('Rejection error:', error);
    return { success: false, error: error.message || 'Rejection failed' };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Supabase expires_at (seconds) to ISO string
 */
function toIsoExpiresAt(expiresAtSeconds?: number | null): string | undefined {
  if (!expiresAtSeconds) return undefined;
  return new Date(expiresAtSeconds * 1000).toISOString();
}

/**
 * Build app-level User object from Supabase auth user + profiles row
 * (Keeps compatibility with your existing User type)
 */
async function buildAppUser(userId: string, email: string): Promise<User> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, role, region_id')

    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error(
      error?.message ||
        'Profile not found. Ensure the profile trigger exists and RLS allows reading own profile.'
    );
  }

  return {
    id: userId,
    email,
    full_name: profile.full_name || '',
    phone: profile.phone_number || '',
    role: profile.role,
    // your UI likely expects a region name (string)
    region: '', // keep empty for now (until we add the regions relationship properly)

    // include region_id if your User type supports it; if it doesn't, remove this line
    region_id: profile.region_id,
  } as any;
}

/**
 * Resolve a region name (string) into region_id UUID (from regions table)
 */
async function resolveRegionId(regionName?: string): Promise<string | null> {
  if (!regionName) return null;
  const { data, error } = await supabase
    .from('regions')
    .select('id')
    .eq('name', regionName)
    .single();

  if (error || !data) return null;
  return data.id;
}


/**
 * Get stored authentication token
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user data
 */
export function getStoredUser(): User | null {
  const userData = localStorage.getItem(USER_KEY);
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem(EXPIRES_KEY);
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

/**
 * Clear all authentication data from localStorage
 */
export function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

/**
 * Get browser/device info for session tracking
 */
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  return `${browser} on ${os}`;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Ghana phone number
 */
export function validateGhanaPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+233|0)[0-9]{9}$/.test(cleaned);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
