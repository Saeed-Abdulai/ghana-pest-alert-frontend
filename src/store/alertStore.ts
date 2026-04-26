// ============================================================================
// ALERT STORE - ZUSTAND
// Manages pest alerts, validation queue, and notification state
// Provides actions for CRUD operations and workflow management
// ============================================================================

import { create } from 'zustand';
import { 
  PestAlert, 
  ValidationQueueItem, 
  Notification, 
  DashboardStats,
  AlertSeverity,
  AlertStatus
} from '@/types';

// Source filter type
type SourceFilter = 'all' | 'ai_generated' | 'external_source' | 'manual' | 'field_report';

// Interface for the alert store state
interface AlertState {
  // Pest alerts data
  alerts: PestAlert[];
  selectedAlert: PestAlert | null;
  
  // Validation queue for extension officers
  validationQueue: ValidationQueueItem[];
  
  // Notifications history
  notifications: Notification[];
  
  // Dashboard statistics
  stats: DashboardStats;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Filter state
  statusFilter: AlertStatus | 'all';
  severityFilter: AlertSeverity | 'all';
  regionFilter: string | 'all';
  sourceFilter: SourceFilter;
  
  // Actions
  setAlerts: (alerts: PestAlert[]) => void;
  addAlert: (alert: PestAlert) => void;
  updateAlert: (id: string, updates: Partial<PestAlert>) => void;
  deleteAlert: (id: string) => void;
  setSelectedAlert: (alert: PestAlert | null) => void;
  addExternalAlert: (alert: PestAlert) => void;
  
  setValidationQueue: (queue: ValidationQueueItem[]) => void;
  updateValidationItem: (id: string, updates: Partial<ValidationQueueItem>) => void;
  
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  
  setStats: (stats: DashboardStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  setStatusFilter: (status: AlertStatus | 'all') => void;
  setSeverityFilter: (severity: AlertSeverity | 'all') => void;
  setRegionFilter: (region: string | 'all') => void;
  setSourceFilter: (source: SourceFilter) => void;
  
  // Computed getters
  getFilteredAlerts: () => PestAlert[];
  getPendingValidations: () => ValidationQueueItem[];
  getPublishedAlerts: () => PestAlert[];
}

// Create the Zustand store
export const useAlertStore = create<AlertState>((set, get) => ({
  // Initial state
  alerts: [],
  selectedAlert: null,
  validationQueue: [],
  notifications: [],
  stats: {
    totalFarmers: 0,
    activeFarmers: 0,
    totalOfficers: 0,
    totalAlerts: 0,
    pendingValidations: 0,
    publishedAlerts: 0,
    smsDelivered: 0,
    smsFailed: 0,
  },
  isLoading: false,
  error: null,
  statusFilter: 'all',
  severityFilter: 'all',
  regionFilter: 'all',
  sourceFilter: 'all',

  // Set all alerts
  setAlerts: (alerts) => set({ alerts }),

  // Add a new alert
  addAlert: (alert) => set((state) => ({ 
    alerts: [alert, ...state.alerts] 
  })),

  // Update an existing alert
  updateAlert: (id, updates) => set((state) => ({
    alerts: state.alerts.map((alert) =>
      alert.id === id ? { ...alert, ...updates } : alert
    ),
  })),

  // Delete an alert
  deleteAlert: (id) => set((state) => ({
    alerts: state.alerts.filter((alert) => alert.id !== id),
  })),

  // Set the currently selected alert for detail view
  setSelectedAlert: (alert) => set({ selectedAlert: alert }),

  // Add external alert and publish it immediately (no validation needed)
  addExternalAlert: (alert) => set((state) => ({
    alerts: [
      {
        ...alert,
        status: 'published',
        source: 'external_source',
      },
      ...state.alerts,
    ],
  })),

  // Set validation queue
  setValidationQueue: (queue) => set({ validationQueue: queue }),

  // Update a validation queue item
  updateValidationItem: (id, updates) => set((state) => ({
    validationQueue: state.validationQueue.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),

  // Set notifications
  setNotifications: (notifications) => set({ notifications }),

  // Add a new notification
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
  })),

  // Set dashboard statistics
  setStats: (stats) => set({ stats }),

  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),

  // Set error message
  setError: (error) => set({ error }),

  // Set filters
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSeverityFilter: (severityFilter) => set({ severityFilter }),
  setRegionFilter: (regionFilter) => set({ regionFilter }),
  setSourceFilter: (sourceFilter) => set({ sourceFilter }),

  // Get filtered alerts based on current filter state
  getFilteredAlerts: () => {
    const { alerts, statusFilter, severityFilter, regionFilter, sourceFilter } = get();
    
    return alerts.filter((alert) => {
      if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
      if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
      if (regionFilter !== 'all' && !alert.affected_regions.includes(regionFilter)) return false;
      if (sourceFilter !== 'all' && alert.source !== sourceFilter) return false;
      return true;
    });
  },

  // Get pending validations
  getPendingValidations: () => {
    const { validationQueue } = get();
    return validationQueue.filter(
      (item) => item.validation_status === 'pending' || item.validation_status === 'in_progress'
    );
  },

  // Get published alerts
  getPublishedAlerts: () => {
    const { alerts } = get();
    return alerts.filter((alert) => alert.status === 'published');
  },
}));

// ============================================================================
// SAMPLE DATA FOR DEMONSTRATION
// ============================================================================
export const SAMPLE_ALERTS: PestAlert[] = [
  {
    id: '1',
    title: 'Fall Armyworm Outbreak in Ashanti Region',
    pest_name: 'Fall Armyworm',
    affected_crops: ['Maize', 'Sorghum', 'Rice'],
    severity: 'critical',
    description: 'Severe infestation of Fall Armyworm detected across multiple districts in Ashanti Region. Immediate action required to prevent crop losses.',
    symptoms: 'Ragged holes in leaves, sawdust-like frass near damaged areas, presence of caterpillars in leaf whorls.',
    preventive_measures: '1. Plant early to avoid peak pest periods\n2. Use pheromone traps for monitoring\n3. Intercrop with non-host plants\n4. Remove and destroy crop residues',
    control_measures: '1. Apply neem-based biopesticides\n2. Use Bacillus thuringiensis (Bt) sprays\n3. For severe cases, apply registered insecticides like Emamectin benzoate\n4. Hand-pick and destroy larvae',
    affected_regions: ['Ashanti', 'Brong-Ahafo', 'Eastern'],
    image_url: 'https://d64gsuwffb70l.cloudfront.net/695a5992bb416dd5fc1f4ad4_1767528991369_79517a53.jpg',
    source: 'ai_generated',
    ai_confidence_score: 92,
    status: 'published',
    created_by: '1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    title: 'Cassava Mosaic Disease Spreading in Volta Region',
    pest_name: 'Cassava Mosaic Virus',
    affected_crops: ['Cassava'],
    severity: 'high',
    description: 'Cassava Mosaic Disease has been confirmed in several farms across Volta Region. The disease is spreading through infected planting materials and whitefly vectors.',
    symptoms: 'Yellow-green mosaic patterns on leaves, leaf curling and distortion, stunted plant growth, reduced tuber size.',
    preventive_measures: '1. Use certified disease-free planting materials\n2. Plant resistant varieties (e.g., CSIR-CRI varieties)\n3. Control whitefly populations\n4. Practice crop rotation',
    control_measures: '1. Remove and burn infected plants immediately\n2. Apply systemic insecticides to control whiteflies\n3. Replant with resistant varieties\n4. Maintain field sanitation',
    affected_regions: ['Volta', 'Eastern', 'Greater Accra'],
    image_url: 'https://d64gsuwffb70l.cloudfront.net/695a5992bb416dd5fc1f4ad4_1767528991982_f8616f71.jpg',
    source: 'field_report',
    ai_confidence_score: 88,
    status: 'published',
    created_by: '2',
    created_at: '2024-01-14T08:00:00Z',
    updated_at: '2024-01-14T16:00:00Z',
  },
  {
    id: '3',
    title: 'Stem Borer Infestation in Northern Rice Fields',
    pest_name: 'Rice Stem Borer',
    affected_crops: ['Rice'],
    severity: 'medium',
    description: 'Moderate stem borer activity detected in irrigated rice fields in Northern Region. Early intervention recommended.',
    symptoms: 'Dead hearts in vegetative stage, white heads at flowering, presence of bore holes in stems, frass in stem tunnels.',
    preventive_measures: '1. Synchronize planting dates\n2. Maintain proper water management\n3. Remove stubbles after harvest\n4. Use light traps for adult moths',
    control_measures: '1. Release Trichogramma parasitoids\n2. Apply granular insecticides in leaf whorls\n3. Spray systemic insecticides at early infestation\n4. Harvest at ground level',
    affected_regions: ['Northern', 'Upper East', 'Upper West'],
    image_url: 'https://d64gsuwffb70l.cloudfront.net/695a5992bb416dd5fc1f4ad4_1767528994753_0434198f.jpg',
    source: 'ai_generated',
    ai_confidence_score: 85,
    status: 'approved',
    created_by: '1',
    created_at: '2024-01-13T12:00:00Z',
    updated_at: '2024-01-13T18:00:00Z',
  },
  {
    id: '4',
    title: 'Cocoa Black Pod Disease Alert - Western Region',
    pest_name: 'Black Pod Disease (Phytophthora)',
    affected_crops: ['Cocoa'],
    severity: 'high',
    description: 'Black Pod Disease outbreak reported in cocoa farms. The wet season conditions are favoring disease spread.',
    symptoms: 'Dark brown to black lesions on pods, white fungal growth in humid conditions, pod rot and mummification.',
    preventive_measures: '1. Regular pruning for good air circulation\n2. Remove infected pods weekly\n3. Apply copper-based fungicides preventively\n4. Maintain proper shade management',
    control_measures: '1. Spray copper hydroxide or metalaxyl-based fungicides\n2. Remove and bury infected pods\n3. Increase harvesting frequency\n4. Apply fungicides before and during rainy season',
    affected_regions: ['Western', 'Western North', 'Ashanti'],
    image_url: 'https://d64gsuwffb70l.cloudfront.net/695a5992bb416dd5fc1f4ad4_1767528996449_3ee92064.jpg',
    source: 'manual',
    status: 'pending',
    created_by: '2',
    created_at: '2024-01-12T09:00:00Z',
    updated_at: '2024-01-12T09:00:00Z',
  },
  {
    id: '5',
    title: 'Aphid Infestation on Vegetable Crops',
    pest_name: 'Aphids',
    affected_crops: ['Tomato', 'Pepper', 'Onion'],
    severity: 'medium',
    description: 'Aphid colonies detected on vegetable crops in Greater Accra peri-urban farms. These pests can transmit viral diseases.',
    symptoms: 'Curled and distorted leaves, sticky honeydew on leaves, presence of small green or black insects, sooty mold growth.',
    preventive_measures: '1. Use reflective mulches\n2. Introduce beneficial insects\n3. Avoid excessive nitrogen fertilization\n4. Monitor crops regularly',
    control_measures: '1. Spray with neem oil solution\n2. Use insecticidal soaps\n3. Release ladybird beetles\n4. Apply systemic insecticides for severe cases',
    affected_regions: ['Greater Accra', 'Central', 'Eastern'],
    source: 'ai_generated',
    ai_confidence_score: 90,
    status: 'under_review',
    created_by: '1',
    created_at: '2024-01-11T14:00:00Z',
    updated_at: '2024-01-11T14:00:00Z',
  },
];

// Sample validation queue items
export const SAMPLE_VALIDATION_QUEUE: ValidationQueueItem[] = [
  {
    id: 'v1',
    pest_alert_id: '4',
    assigned_officer_id: '2',
    original_content: {
      title: 'Cocoa Black Pod Disease Alert - Western Region',
      description: 'Black Pod Disease outbreak reported in cocoa farms.',
      symptoms: 'Dark brown to black lesions on pods.',
      preventive_measures: 'Regular pruning for good air circulation.',
      control_measures: 'Spray copper hydroxide fungicides.',
    },
    validation_status: 'pending',
    created_at: '2024-01-12T09:30:00Z',
  },
  {
    id: 'v2',
    pest_alert_id: '5',
    assigned_officer_id: '2',
    original_content: {
      title: 'Aphid Infestation on Vegetable Crops',
      description: 'Aphid colonies detected on vegetable crops.',
      symptoms: 'Curled and distorted leaves.',
      preventive_measures: 'Use reflective mulches.',
      control_measures: 'Spray with neem oil solution.',
    },
    validation_status: 'in_progress',
    officer_notes: 'Reviewing the control measures for accuracy.',
    created_at: '2024-01-11T14:30:00Z',
  },
];