// ============================================================================
// REGISTER MODAL COMPONENT
// User registration modal with role selection and validation
// Supports farmer registration with approval workflow
// ============================================================================

import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  Leaf,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Users
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { GHANA_REGIONS, GHANA_CROPS } from '@/types';
import { validatePassword, validateEmail, validateGhanaPhone } from '@/services/authService';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

type RegistrationStep = 'role' | 'account' | 'profile' | 'success';
type UserRole = 'farmer';

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  // Form state
  const [step, setStep] = useState<RegistrationStep>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  
  // Account details
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  // Multi-region support: farmer can select multiple farming regions
  const [farmingRegions, setFarmingRegions] = useState<string[]>([]);
  const [district, setDistrict] = useState('');
  const [community, setCommunity] = useState('');
  
  // Farmer-specific
  const [farmSize, setFarmSize] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  
  // UI state
  const [localError, setLocalError] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Auth store
  const { register, isLoading, error } = useAuthStore();

  // Validate current step
  const validateStep = (): boolean => {
    setLocalError('');

    if (step === 'account') {
      if (!validateEmail(email)) {
        setLocalError('Please enter a valid email address');
        return false;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setLocalError(passwordValidation.errors[0]);
        return false;
      }

      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return false;
      }
    }

    if (step === 'profile') {
      if (!fullName.trim()) {
        setLocalError('Please enter your full name');
        return false;
      }

      if (!validateGhanaPhone(phone)) {
        setLocalError('Please enter a valid Ghana phone number');
        return false;
      }

      if (farmingRegions.length === 0) {
        setLocalError('Please select at least one farming region');
        return false;
      }

      if (selectedRole === 'farmer' && selectedCrops.length === 0) {
        setLocalError('Please select at least one crop');
        return false;
      }
    }

    return true;
  };

  // Handle next step
  const handleNext = () => {
    if (!validateStep()) return;

    if (step === 'role') setStep('account');
    else if (step === 'account') setStep('profile');
    else if (step === 'profile') handleSubmit();
  };

  // Handle previous step
  const handleBack = () => {
    if (step === 'account') setStep('role');
    else if (step === 'profile') setStep('account');
  };

  // Toggle crop selection
  const toggleCrop = (crop: string) => {
    setSelectedCrops(prev =>
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    );
  };

  // Toggle farming region selection (multi-select)
  const toggleFarmingRegion = (r: string) => {
    setFarmingRegions(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      const result = await register({
        email,
        password,
        full_name: fullName,
        phone,
        role: 'farmer',
        // Primary region = first selected region (for users table backward compat)
        region: farmingRegions[0] || '',
        // All farming regions passed for the farmers table
        farming_regions: farmingRegions,
        district,
        community,
        ...(selectedRole === 'farmer' && {
          farm_size_hectares: farmSize ? parseFloat(farmSize) : undefined,
          primary_crops: selectedCrops
        }),
      });

      if (result.success) {
        setSuccessMessage(result.message || 'Registration successful!');
        setStep('success');
      } else {
        setLocalError(result.message || 'Registration failed');
      }
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed');
    }
  };

  // Reset form
  const resetForm = () => {
    setStep('role');
    setSelectedRole('farmer');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
    setFarmingRegions([]);
    setDistrict('');
    setCommunity('');
    setFarmSize('');
    setSelectedCrops([]);
    setLocalError('');
    setSuccessMessage('');
    setRequiresApproval(false);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Create Account</h2>
              <p className="text-green-100 text-sm">
                {step === 'role' && 'Select your account type'}
                {step === 'account' && 'Enter your credentials'}
                {step === 'profile' && 'Complete your profile'}
                {step === 'success' && 'Registration complete'}
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          {step !== 'success' && (
            <div className="flex gap-2 mt-4">
              {['role', 'account', 'profile'].map((s, i) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full ${
                    ['role', 'account', 'profile'].indexOf(step) >= i
                      ? 'bg-white'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {displayError && step !== 'success' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {displayError}
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 'role' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">
                Create your Farmer account to receive pest alerts and recommendations:
              </p>
              <button
                onClick={() => setSelectedRole('farmer')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedRole === 'farmer'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedRole === 'farmer' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Users className={`w-6 h-6 ${
                      selectedRole === 'farmer' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Farmer</h3>
                    <p className="text-sm text-gray-500">
                      Receive pest alerts and recommendations for your crops
                    </p>
                  </div>
                </div>
                {selectedRole === 'farmer' && (
                  <div className="mt-3 p-2 bg-amber-50 rounded-lg">
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === 'account' && (
            <div className="space-y-4">
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
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Min 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Profile Details */}
          {step === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+233 or 0XX XXX XXXX"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Your district"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Community
                  </label>
                  <input
                    type="text"
                    value={community}
                    onChange={(e) => setCommunity(e.target.value)}
                    placeholder="Your community/town"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
              </div>

              {/* Farmer-specific fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farm Size (hectares)
                </label>
                <input
                  type="number"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  placeholder="e.g., 2.5"
                  step="0.1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              {/* ── FARMING REGIONS — multi-select, all 17 regions ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Farming Region(s)
                    <span className="ml-1 text-xs font-normal text-gray-500">— select all that apply</span>
                  </label>
                  {farmingRegions.length > 0 && (
                    <span className="text-xs text-blue-600 font-medium">
                      {farmingRegions.length} selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Select every region where you have farmland. You can select more than one.
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {GHANA_REGIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleFarmingRegion(r)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        farmingRegions.includes(r)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Crops (select at least one)
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {GHANA_CROPS.slice(0, 12).map((crop) => (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => toggleCrop(crop)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCrops.includes(crop)
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                requiresApproval ? 'bg-amber-100' : 'bg-green-100'
              }`}>
                <CheckCircle className={`w-8 h-8 ${
                  requiresApproval ? 'text-amber-600' : 'text-green-600'
                }`}/>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {requiresApproval ? 'Registration Submitted!' : 'Registration Successful!'}
              </h3>

              <p className="text-gray-600 mb-4">
                {successMessage}
              </p>

              {requiresApproval ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    ⏳ Pending Approval
                  </p>
                  <p className="text-sm text-amber-700">
                    Your registration is under review. An extension officer or admin will approve your application. You will be able to log in once approved.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                  <p className="text-sm text-green-800">
                    Your account has been created. You can now log in.
                  </p>
                </div>
              )}

              {!requiresApproval && (
                <button
                  onClick={() => {
                    handleClose();
                    onSwitchToLogin();
                  }}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go to Login
                </button>
              )}

              {requiresApproval && (
                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          {step !== 'success' && (
            <div className="flex gap-3 mt-6">
              {step !== 'role' && (
                <button
                  onClick={handleBack}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : step === 'profile' ? (
                  'Complete Registration'
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Login link */}
          {step !== 'success' && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;