// =====================================================
// Pipeline Constants and Types
// =====================================================

// Pipeline Stages
export const PIPELINE_STAGES = {
  LOI_ACCEPTED: 'loi_accepted',
  DUE_DILIGENCE: 'due_diligence',
  CONTRACT: 'contract',
  CLOSING: 'closing',
  WON: 'won',
  LOST: 'lost',
} as const;

export type PipelineStage = typeof PIPELINE_STAGES[keyof typeof PIPELINE_STAGES];

// Pipeline Stage Labels
export const STAGE_LABELS: Record<PipelineStage, string> = {
  loi_accepted: 'LOI Accepted',
  due_diligence: 'Due Diligence',
  contract: 'Contract',
  closing: 'Closing',
  won: 'Won',
  lost: 'Lost',
};

// Pipeline Stage Colors (for UI)
export const STAGE_COLORS: Record<PipelineStage, string> = {
  loi_accepted: '#10B981', // green-500
  due_diligence: '#3B82F6', // blue-500
  contract: '#F59E0B', // amber-500
  closing: '#8B5CF6', // purple-500
  won: '#059669', // green-600
  lost: '#EF4444', // red-500
};

// Pipeline Stage Order
export const STAGE_ORDER: PipelineStage[] = [
  'loi_accepted',
  'due_diligence',
  'contract',
  'closing',
  'won',
  'lost',
];

// Valid Stage Transitions
export const VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  loi_accepted: ['due_diligence', 'lost'],
  due_diligence: ['contract', 'lost'],
  contract: ['closing', 'lost'],
  closing: ['won', 'lost'],
  won: [],
  lost: [],
};

// Probability to Close by Stage
export const STAGE_PROBABILITY: Record<PipelineStage, number> = {
  loi_accepted: 50,
  due_diligence: 65,
  contract: 80,
  closing: 95,
  won: 100,
  lost: 0,
};

// Deal Statuses
export const DEAL_STATUS = {
  ACTIVE: 'active',
  WON: 'won',
  LOST: 'lost',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
} as const;

export type DealStatus = typeof DEAL_STATUS[keyof typeof DEAL_STATUS];

// Deal Status Labels
export const STATUS_LABELS: Record<DealStatus, string> = {
  active: 'Active',
  won: 'Won',
  lost: 'Lost',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

// Deal Status Colors
export const STATUS_COLORS: Record<DealStatus, string> = {
  active: '#10B981', // green-500
  won: '#059669', // green-600
  lost: '#EF4444', // red-500
  on_hold: '#F59E0B', // amber-500
  cancelled: '#6B7280', // gray-500
};

// Priority Levels
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

// Priority Labels
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Priority Colors
export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#6B7280', // gray-500
  medium: '#3B82F6', // blue-500
  high: '#F59E0B', // amber-500
  urgent: '#EF4444', // red-500
};

// Confidence Levels
export const CONFIDENCE = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type Confidence = typeof CONFIDENCE[keyof typeof CONFIDENCE];

// Confidence Labels
export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

// Activity Types
export const ACTIVITY_TYPE = {
  NOTE: 'note',
  CALL: 'call',
  EMAIL: 'email',
  MEETING: 'meeting',
  INSPECTION: 'inspection',
  OFFER: 'offer',
  COUNTER_OFFER: 'counter_offer',
  MILESTONE: 'milestone',
  TASK: 'task',
  OTHER: 'other',
} as const;

export type ActivityType = typeof ACTIVITY_TYPE[keyof typeof ACTIVITY_TYPE];

// Activity Type Labels
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  note: 'Note',
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  inspection: 'Inspection',
  offer: 'Offer',
  counter_offer: 'Counter Offer',
  milestone: 'Milestone',
  task: 'Task',
  other: 'Other',
};

// Activity Type Icons (Lucide icon names)
export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  note: 'FileText',
  call: 'Phone',
  email: 'Mail',
  meeting: 'Users',
  inspection: 'Search',
  offer: 'DollarSign',
  counter_offer: 'Repeat',
  milestone: 'Flag',
  task: 'CheckSquare',
  other: 'MoreHorizontal',
};

// Activity Outcomes
export const ACTIVITY_OUTCOME = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
} as const;

export type ActivityOutcome = typeof ACTIVITY_OUTCOME[keyof typeof ACTIVITY_OUTCOME];

// Activity Outcome Labels
export const OUTCOME_LABELS: Record<ActivityOutcome, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
};

// Activity Outcome Colors
export const OUTCOME_COLORS: Record<ActivityOutcome, string> = {
  positive: '#10B981', // green-500
  neutral: '#6B7280', // gray-500
  negative: '#EF4444', // red-500
};

// Lost Reasons
export const LOST_REASON = {
  PRICE: 'price',
  INSPECTION: 'inspection',
  FINANCING: 'financing',
  SELLER_CHANGED_MIND: 'seller_changed_mind',
  TITLE_ISSUES: 'title_issues',
  BUYER_CHANGED_MIND: 'buyer_changed_mind',
  APPRAISAL: 'appraisal',
  TIMELINE: 'timeline',
  OTHER: 'other',
} as const;

export type LostReason = typeof LOST_REASON[keyof typeof LOST_REASON];

// Lost Reason Labels
export const LOST_REASON_LABELS: Record<LostReason, string> = {
  price: 'Price Too High',
  inspection: 'Inspection Issues',
  financing: 'Financing Fell Through',
  seller_changed_mind: 'Seller Changed Mind',
  title_issues: 'Title Issues',
  buyer_changed_mind: 'Buyer Changed Mind',
  appraisal: 'Appraisal Issues',
  timeline: 'Timeline Issues',
  other: 'Other',
};

// Property Types
export const PROPERTY_TYPE = {
  SINGLE_FAMILY: 'Single Family',
  MULTI_FAMILY: 'Multi Family',
  CONDO: 'Condo',
  TOWNHOUSE: 'Townhouse',
  COMMERCIAL: 'Commercial',
  LAND: 'Land',
  OTHER: 'Other',
} as const;

export type PropertyType = typeof PROPERTY_TYPE[keyof typeof PROPERTY_TYPE];

// =====================================================
// TypeScript Interfaces
// =====================================================

export interface PipelineDeal {
  id: string;
  property_address: string;
  property_city?: string;
  property_state?: string;
  property_zip?: string;
  deal_name?: string;
  property_type?: PropertyType;

  // Financial
  opportunity_value: number;
  listed_price?: number;
  offer_price?: number;
  down_payment?: number;
  monthly_payment?: number;
  balloon_period?: number;
  estimated_rehab_cost?: number;
  total_deal_value?: number;

  // Agent
  agent_id: number;
  agent_name: string;
  agent_email: string;

  // Contacts
  realtor_name?: string;
  realtor_email?: string;
  realtor_phone?: string;
  seller_name?: string;
  seller_email?: string;
  seller_phone?: string;

  // Pipeline
  stage: PipelineStage;
  status: DealStatus;

  // Dates
  loi_accepted_date: string;
  due_diligence_date?: string;
  contract_date?: string;
  closing_date?: string;
  expected_closing_date?: string;
  actual_closing_date?: string;
  won_at?: string;
  lost_at?: string;

  // LOI Reference
  loi_tracking_id?: string;
  loi_sent_at?: string;
  loi_replied_at?: string;

  // Additional
  notes?: string;
  priority: Priority;
  tags?: string[];
  probability_to_close: number;
  confidence_level: Confidence;
  lost_reason?: LostReason;
  cancellation_reason?: string;

  // Metadata
  created_by?: string;
  last_updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStageHistory {
  id: string;
  deal_id: string;
  from_stage?: PipelineStage;
  to_stage: PipelineStage;
  transitioned_at: string;
  days_in_previous_stage?: number;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface PipelineActivity {
  id: string;
  deal_id: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  outcome?: ActivityOutcome;
  next_action?: string;
  next_action_due_date?: string;
  created_by?: string;
  created_at: string;
}

export interface PipelineSummary {
  total_active_deals: number;
  total_won_deals: number;
  total_lost_deals: number;
  active_pipeline_value: number;
  won_deal_value: number;
  lost_deal_value: number;
  avg_probability: number;
  weighted_pipeline_value: number;
  overall_conversion_rate: number;
  avg_days_to_close: number;
}

export interface PipelineByStage {
  stage: PipelineStage;
  deal_count: number;
  total_value: number;
  avg_deal_value: number;
  avg_probability: number;
  weighted_value: number;
  avg_days_in_stage: number;
}

export interface AgentPipelinePerformance {
  agent_id: number;
  agent_name: string;
  active_deals: number;
  won_deals: number;
  lost_deals: number;
  total_deals: number;
  active_pipeline_value: number;
  total_won_value: number;
  total_lost_value: number;
  conversion_rate: number;
  avg_won_deal_size: number;
  avg_active_deal_size: number;
  avg_days_to_close: number;
}

export interface PipelineForecast {
  closing_month: string;
  expected_closings: number;
  expected_value: number;
  weighted_expected_value: number;
  avg_probability: number;
  loi_accepted_count: number;
  due_diligence_count: number;
  contract_count: number;
  closing_count: number;
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Check if a stage transition is valid
 */
export function isValidTransition(fromStage: PipelineStage, toStage: PipelineStage): boolean {
  const allowedTransitions = VALID_TRANSITIONS[fromStage] || [];
  return allowedTransitions.includes(toStage);
}

/**
 * Get the next valid stages for a given stage
 */
export function getNextStages(currentStage: PipelineStage): PipelineStage[] {
  return VALID_TRANSITIONS[currentStage] || [];
}

/**
 * Format currency
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  return `${Math.round(value)}%`;
}

/**
 * Calculate days between dates
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
