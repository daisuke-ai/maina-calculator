// lib/ringcentral/types.ts
// TypeScript types for RingCentral call data

export interface RingCentralCallRecord {
  id: string;
  uri: string;
  sessionId: string;
  startTime: string; // ISO 8601
  duration: number; // seconds
  type: 'Voice' | 'Fax';
  direction: 'Inbound' | 'Outbound';
  action: 'Phone Call' | 'VoIP Call' | 'Outbound Fax' | 'Inbound Fax';
  result: 'Accepted' | 'Missed' | 'Call connected' | 'Voicemail' | 'Rejected' | 'Reply' | 'Received' | 'Receive Error' | 'Fax on Demand' | 'Partial Receive' | 'Blocked' | 'Call Failed' | 'Call Failure' | 'Internal Error' | 'IP Phone Offline' | 'Restricted Number' | 'Wrong Number' | 'Stopped' | 'Suspended account' | 'Hang up' | 'No Answer' | 'Busy';
  to?: {
    phoneNumber?: string;
    extensionNumber?: string;
    name?: string;
    location?: string;
  };
  from?: {
    phoneNumber?: string;
    extensionNumber?: string;
    name?: string;
    location?: string;
  };
  transport?: 'PSTN' | 'VoIP';
  lastModifiedTime?: string;
  recording?: {
    id: string;
    uri: string;
    type: 'OnDemand' | 'Automatic';
    contentUri: string;
  };
  extension?: {
    id: string;
    uri: string;
  };
  reason?: string;
  reasonDescription?: string;
  legs?: CallLeg[];
}

export interface CallLeg {
  startTime: string;
  duration: number;
  type: 'Voice' | 'Fax';
  direction: 'Inbound' | 'Outbound';
  action: string;
  result: string;
  to?: {
    phoneNumber?: string;
    name?: string;
  };
  from?: {
    phoneNumber?: string;
    name?: string;
  };
  transport?: 'PSTN' | 'VoIP';
  recording?: {
    id: string;
    uri: string;
    type: string;
    contentUri: string;
  };
  extension?: {
    id: string;
    uri: string;
  };
}

export interface RingCentralCallLogResponse {
  uri: string;
  records: RingCentralCallRecord[];
  paging: {
    page: number;
    totalPages: number;
    perPage: number;
    totalElements: number;
    pageStart: number;
    pageEnd: number;
  };
  navigation?: {
    firstPage?: { uri: string };
    nextPage?: { uri: string };
    previousPage?: { uri: string };
    lastPage?: { uri: string };
  };
}

export interface RingCentralExtension {
  id: string;
  uri: string;
  extensionNumber: string;
  contact?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    email?: string;
    businessPhone?: string;
  };
  name?: string;
  type: 'User' | 'Department' | 'Announcement' | 'Voicemail' | 'SharedLinesGroup' | 'PagingOnly' | 'ParkLocation' | 'Limited';
  status: 'Enabled' | 'Disabled' | 'NotActivated';
  phoneNumbers?: Array<{
    phoneNumber: string;
    type: 'VoiceFax' | 'FaxOnly' | 'VoiceOnly';
    usageType: 'MainCompanyNumber' | 'DirectNumber' | 'CompanyNumber' | 'Department';
  }>;
}

// Database types for storing in Supabase
export interface CallLog {
  id: string; // RingCentral call ID
  agent_id: number | null; // Maps to our agents
  session_id: string;
  direction: 'Inbound' | 'Outbound';
  call_type: 'Voice' | 'Fax';
  call_result: string; // Accepted, Missed, Voicemail, etc.
  from_number: string | null;
  to_number: string | null;
  from_name: string | null;
  to_name: string | null;
  duration: number; // seconds
  started_at: string; // ISO timestamp
  ended_at: string | null; // Calculated from started_at + duration
  recording_id: string | null;
  recording_uri: string | null;
  extension_id: string | null;
  extension_number: string | null;
  transport: string | null; // PSTN or VoIP
  synced_at: string; // When we imported this record
  created_at: string;
  updated_at: string;
}

export interface AgentCallPerformance {
  agent_id: number;
  agent_name: string;
  total_calls: number;
  inbound_calls: number;
  outbound_calls: number;
  answered_calls: number;
  missed_calls: number;
  voicemail_calls: number;
  total_duration: number; // seconds
  avg_duration: number; // seconds
  answer_rate: number; // percentage
  first_call: string | null;
  last_call: string | null;
}

export interface DailyCallVolume {
  date: string;
  total_calls: number;
  inbound_calls: number;
  outbound_calls: number;
  answered_calls: number;
  missed_calls: number;
  total_duration: number;
  avg_duration: number;
  active_agents: number;
}
