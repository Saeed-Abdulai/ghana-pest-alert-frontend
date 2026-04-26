// ============================================================================
// AUTHENTICATION STORE - ZUSTAND
// Now connects to Node.js backend instead of Supabase directly
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';
import { authApi } from '@/services/backendApi';

interface AuthState {
  user: User | null;
  token: string | null;
  expiresAt: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<{ success: boolean; message?: string; requiresApproval?: boolean }>;
  logout: () => Promise<void>;
  verifySession: () => Promise<boolean>;
  initialize: () => Promise<void>;

  isAdmin: () => boolean;
  isExtensionOfficer: () => boolean;
  isFarmer: () => boolean;
  hasRole: (role: UserRole) => boolean;
  isAuthenticated: () => boolean;
}

const TOKEN_KEY = 'ghana_pest_alert_token';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      expiresAt: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(email, password);

          if (response.success && response.token) {
            // Store token in localStorage for backendApi to use
            localStorage.setItem(TOKEN_KEY, response.token);

            set({
              user: response.user,
              token: response.token,
              expiresAt: null,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({ isLoading: false, error: response.error || 'Login failed' });
            return false;
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Login failed' });
          return false;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.register(data);
          set({ isLoading: false });

          if (response.success) {
            // If officer registered directly, store their token
            if (response.token) {
              localStorage.setItem(TOKEN_KEY, response.token);
              set({ user: response.user, token: response.token });
            }
            return {
              success: true,
              message: response.message,
              requiresApproval: response.requiresApproval,
            };
          } else {
            set({ error: response.error });
            return { success: false, message: response.error };
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Registration failed' });
          return { success: false, message: error.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await authApi.logout();
        } catch (err) {
          // Even if the API call fails, clear local state
          console.error('Logout error:', err);
        } finally {
          localStorage.removeItem(TOKEN_KEY);
          set({
            user: null,
            token: null,
            expiresAt: null,
            isLoading: false,
            error: null,
          });
        }
      },

      verifySession: async () => {
        const token = get().token || localStorage.getItem(TOKEN_KEY);

        if (!token) return false;

        try {
          const response = await authApi.verify();

          if (response.success && response.user) {
            set({ user: response.user });
            return true;
          } else {
            localStorage.removeItem(TOKEN_KEY);
            set({ user: null, token: null });
            return false;
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          set({ user: null, token: null });
          return false;
        }
      },

      initialize: async () => {
        const token = localStorage.getItem(TOKEN_KEY);

        if (token) {
          set({ token });
          const isValid = await get().verifySession();
          if (!isValid) {
            localStorage.removeItem(TOKEN_KEY);
            set({ user: null, token: null, isInitialized: true });
            return;
          }
        }

        set({ isInitialized: true });
      },

      isAdmin: () => get().user?.role === 'admin',
      isExtensionOfficer: () => get().user?.role === 'extension_officer',
      isFarmer: () => get().user?.role === 'farmer',
      hasRole: (role) => get().user?.role === role,
      isAuthenticated: () => !!get().user && !!get().token,
    }),
    {
      name: 'ghana-pest-alert-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        expiresAt: state.expiresAt,
      }),
    }
  )
);

// ============================================================================
// DEMO USERS — kept for fallback testing only
// ============================================================================
export const DEMO_USERS: User[] = [
  {
    id: 'demo-admin-1',
    email: 'admin@pestalert.gh',
    full_name: 'Kwame Asante',
    phone: '+233201234567',
    role: 'admin',
    region: 'Greater Accra',
    district: 'Accra Metropolitan',
    community: 'Accra',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'demo-officer-1',
    email: 'officer@pestalert.gh',
    full_name: 'Ama Mensah',
    phone: '+233209876543',
    role: 'extension_officer',
    region: 'Ashanti',
    district: 'Kumasi Metropolitan',
    community: 'Kumasi',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];