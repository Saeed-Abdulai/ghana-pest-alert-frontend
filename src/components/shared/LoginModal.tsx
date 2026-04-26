// ============================================================================
// LOGIN MODAL COMPONENT
// Authentication modal with email/password login
// Includes real authentication and demo account fallback
// ============================================================================

import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, AlertCircle, Leaf, Eye, EyeOff, UserPlus } from 'lucide-react';
import { User } from '@/types';
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { DEMO_USERS } from "@/store/authStore"; // or wherever your demo users live



interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  


  // Auth store
  const { login, isLoading, error, setUser } = useAuthStore();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    try {
      if (useDemoMode) {
        // Demo mode - use local demo users
        const user = DEMO_USERS.find(u => u.email === email);
        if (user && password === 'Demo123!') {
          await new Promise(resolve => setTimeout(resolve, 500));
          setUser(user);
          useAuthStore.setState({ token: 'demo-token', isLoading: false });
          onClose();
          return;
        } else {
          setLocalError('Invalid demo credentials. Use demo accounts below.');
        }
      } else {

      // Real authentication — calls Node.js backend
    const success = await login(email, password);
    if (success) {
      onClose();
    } else {
      setLocalError('Invalid email or password. Please try again.');
    }
      }
      
    } catch (err: any) {
      setLocalError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
   };

  // Quick login with demo account
  const handleDemoLogin = async (user: User) => {
    setIsSubmitting(true);
    setLocalError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(user);
      useAuthStore.setState({ token: 'demo-token', isLoading: false });
      onClose();
    } catch (err) {
      setLocalError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  const displayError = localError || error;

  const handleSendReset = async () => {
    setLocalError("");
    setResetMessage("");
  
    const emailToUse = (resetEmail || email).trim();
    if (!emailToUse) {
      setLocalError("Please enter your email address.");
      return;
    }
  
    const redirectTo = `${window.location.origin}/reset-password`;
    console.log("RESET redirectTo:", redirectTo);
  
    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
        redirectTo,
      });
  
      if (error) {
        setLocalError(error.message);
        return;
      }
  
      setResetMessage(
        "Password reset email sent. Please check your inbox and open the link to set a new password."
      );
    } catch (e: any) {
      setLocalError(e?.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsSendingReset(false);
    }
  };  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Leaf className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <p className="text-green-100 text-sm">
                Sign in to Ghana Pest Alert System
              </p>
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="p-6">
          {/* Mode toggle */}
          <div className="flex items-center justify-center gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setUseDemoMode(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                !useDemoMode ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Real Login
            </button>
            <button
              type="button"
              onClick={() => setUseDemoMode(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                useDemoMode ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Demo Mode
            </button>
          </div>

          {/* Error message */}
          {displayError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {displayError}
            </div>
          )}

{/* Login form OR Forgot Password */}
{showForgotPassword && !useDemoMode ? (
  <div className="space-y-4">
    <button
      type="button"
      onClick={() => {
        setShowForgotPassword(false);
        setLocalError("");
        setResetMessage("");
      }}
      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Sign In
    </button>

    <div>
      <h3 className="text-lg font-semibold text-gray-900">Reset your password</h3>
      <p className="text-sm text-gray-600">
        Enter your email and we’ll send you a reset link.
      </p>
    </div>

    {resetMessage && (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
        {resetMessage}
      </div>
    )}

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Email Address
      </label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
        />
      </div>
    </div>

    <button
      type="button"
      onClick={handleSendReset}
      disabled={isSendingReset}
      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isSendingReset ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Sending...
        </>
      ) : (
        "Send Reset Link"
      )}
    </button>
  </div>
  
) : (
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Email input */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Email Address
      </label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
        />
      </div>
    </div>

    {/* Password input */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Password
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>

    {/* Forgot password link */}
    {!useDemoMode && (
      <div className="text-right">
        <button
          type="button"
          onClick={() => {
            setShowForgotPassword(true);
            setResetEmail(email);
            setLocalError("");
            setResetMessage("");
          }}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Forgot password?
        </button>
      </div>
    )}

    {/* Submit button */}
    <button
      type="submit"
      disabled={isLoading || isSubmitting}
      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {(isLoading || isSubmitting) ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign In"
      )}
    </button>
  </form>
)}


          {/* Register link */}
          {!useDemoMode && onSwitchToRegister && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={onSwitchToRegister}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Register here
                </button>
              </p>
            </div>
          )}

          {/* Demo accounts section */}
          {useDemoMode && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    Quick Demo Login
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center mb-3">
                  Click to login instantly (Password: Demo123!)
                </p>

                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleDemoLogin(user)}
                    disabled={isLoading || isSubmitting}
                    className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-600'
                        : user.role === 'extension_officer'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      <span className="font-bold text-sm">
                        {user.full_name.charAt(0)}
                      </span>
                    </div>

                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.role === 'admin' 
                          ? 'Administrator' 
                          : user.role === 'extension_officer'
                          ? 'Extension Officer'
                          : 'Farmer'
                        }
                      </p>
                    </div>

                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'extension_officer'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role === 'admin' 
                        ? 'Admin' 
                        : user.role === 'extension_officer'
                        ? 'Officer'
                        : 'Farmer'
                      }
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Password requirements hint */}
          {!useDemoMode && (
           <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
           <p className="text-xs text-green-700 font-semibold mb-1">Test Credentials:</p>
           <p className="text-xs text-green-600">Admin: admin@pestalert.gh / Admin2024</p>
           <p className="text-xs text-green-600">Officer: officer@pestalert.gh / Officer2024</p>
         </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
