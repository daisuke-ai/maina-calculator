// config/ringcentral-mapping-fixed.ts
// UPDATED: Based on actual RingCentral report from Nov 17, 2025
// Maps RingCentral extensions and phone numbers to our agent IDs

export const RINGCENTRAL_EXTENSION_TO_AGENT: Record<string, number> = {
  // Extension -> Agent ID mapping (from RingCentral report)
  '101': 11,  // Abdullah Abid -> Abdullah (Noyaan)
  '102': 10,  // Tayyab #C -> Tayyab (Burakh)
  '103': 9,   // Awais #B -> Awais (Ozan)
  '104': 6,   // Masoumah #C -> Maasomah (Lina)
  '105': 5,   // Farhat #C -> Farhat
  '106': 16,  // Fatima #C -> Fatima (Eleena)
  '107': 12,  // Emir #B -> Amir (Emir)
  '108': 7,   // Faizan #C -> Faizan (Fazil)
  '109': 8,   // Mahrukh #C -> Mahrukh (Mina)
  '110': 25,  // Who # Operations -> Mian
  '111': 17,  // Rameen #A -> Rameen (Ayla)
  '113': 21,  // Laiba #A -> Laiba (Eda)
  '114': 3,   // Eman #A -> Eman (Elif)
  '116': 2,   // Ayesha #C -> Ayesha (Ada) - ADDED: This extension also belongs to Ayesha
  '117': 28,  // English Issue #C -> Support (English Issue)
  '118': 26,  // Ifaf Shahab -> Ifaf
  '119': 27,  // Shahab Javed -> Shahab
  '120': 19,  // Hannan #A -> Hannan
  '121': 15,  // Talha #C -> Talha (Tabeeb)
  '122': 20,  // Mishaal #A -> Mishaal (Anna)
  '123': 2,   // Ayesha #C -> Ayesha (Ada)
};

// Additional mappings for direct dial numbers (if extension not available)
// Format: Full phone number (digits only) -> agent ID
export const PHONE_NUMBER_TO_AGENT: Record<string, number> = {
  // Farhat's direct numbers
  '6615962945': 5,
  '4062299305': 5,

  // Maasomah/Lina's numbers
  '6615962746': 6,
  '4062299306': 6,

  // Faizan's numbers
  '6616050324': 7,
  '4062299307': 7,

  // Mahrukh/Mina's numbers
  '6616050328': 8,
  '4062299308': 8,

  // Awais/Ozan's numbers
  '6615962522': 9,
  '4062299309': 9,

  // Tayyab/Burakh's numbers
  '6615962409': 10,
  '4062299310': 10,

  // Abdullah/Noyaan's numbers
  '6615962010': 11,
  '4062299311': 11,

  // Amir/Emir's numbers
  '6616050319': 12,
  '4062299312': 12,

  // Talha/Tabeeb's numbers
  '5593176681': 15,
  '4062299315': 15,

  // Fatima/Eleena's numbers
  '6615962959': 16,
  '4062299316': 16,

  // Rameen/Ayla's numbers
  '5592185757': 17,
  '4062299317': 17,

  // Hannan's numbers
  '5592860509': 19,
  '4062299319': 19,

  // Mishaal/Anna's numbers
  '5597775856': 20,
  '4062299320': 20,

  // Laiba/Eda's numbers
  '5592185524': 21,
  '4062299321': 21,

  // Ayesha/Ada's numbers
  '5597775113': 2,
  '4062299302': 2,

  // Eman/Elif's numbers
  '5592860470': 3,
  '4062299303': 3,

  // Mian's number
  '6616050329': 25,

  // Ifaf's number
  '5594212021': 26,

  // Shahab's number
  '5595700778': 27,

  // Support/English Issue
  '5592067202': 28,
};

/**
 * Get agent ID from RingCentral extension number
 */
export function getAgentIdFromExtension(extension: string | undefined | null): number | null {
  if (!extension) return null;

  // Clean extension (remove any non-digits)
  const cleanExt = extension.replace(/\D/g, '');

  return RINGCENTRAL_EXTENSION_TO_AGENT[cleanExt] || null;
}

/**
 * Get agent ID from phone number
 * Tries multiple formats
 */
export function getAgentIdFromPhone(phoneNumber: string | undefined | null): number | null {
  if (!phoneNumber) return null;

  // Clean phone number (digits only)
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Try full number match first
  if (PHONE_NUMBER_TO_AGENT[cleaned]) {
    return PHONE_NUMBER_TO_AGENT[cleaned];
  }

  // Try without country code (remove leading 1 if 11 digits)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const withoutCountry = cleaned.substring(1);
    if (PHONE_NUMBER_TO_AGENT[withoutCountry]) {
      return PHONE_NUMBER_TO_AGENT[withoutCountry];
    }
  }

  // Try last 10 digits
  if (cleaned.length > 10) {
    const last10 = cleaned.slice(-10);
    if (PHONE_NUMBER_TO_AGENT[last10]) {
      return PHONE_NUMBER_TO_AGENT[last10];
    }
  }

  // Try matching by last 4 digits (less reliable)
  const last4 = cleaned.slice(-4);
  for (const [fullNumber, agentId] of Object.entries(PHONE_NUMBER_TO_AGENT)) {
    if (fullNumber.endsWith(last4)) {
      return agentId;
    }
  }

  return null;
}

/**
 * Primary function to get agent ID from call record
 * Tries extension first (most reliable), then phone number
 */
export function getAgentIdFromCallRecord(
  extensionNumber: string | undefined | null,
  phoneNumber: string | undefined | null,
  extensionId?: string | undefined | null
): number | null {
  // Try extension number first (most reliable)
  const fromExtension = getAgentIdFromExtension(extensionNumber);
  if (fromExtension) return fromExtension;

  // Try extension ID if different from extension number
  if (extensionId && extensionId !== extensionNumber) {
    const fromExtId = getAgentIdFromExtension(extensionId);
    if (fromExtId) return fromExtId;
  }

  // Fall back to phone number
  return getAgentIdFromPhone(phoneNumber);
}

// Export a debug function to check mappings
export function debugMapping(extensionNumber?: string | null, phoneNumber?: string | null): void {
  console.log('=== RingCentral Mapping Debug ===');
  console.log('Extension:', extensionNumber);
  console.log('Phone:', phoneNumber);

  const agentId = getAgentIdFromCallRecord(extensionNumber, phoneNumber);
  console.log('Mapped Agent ID:', agentId);

  if (!agentId) {
    console.log('⚠️ No mapping found!');
    console.log('Available extensions:', Object.keys(RINGCENTRAL_EXTENSION_TO_AGENT).sort());
  }
}

// Verification data from RingCentral report (Nov 17, 2025)
export const EXPECTED_CALL_COUNTS = {
  '122': { name: 'Mishaal #A', calls: 37, agentId: 20 },
  '104': { name: 'Masoumah #C', calls: 21, agentId: 6 },
  '108': { name: 'Faizan #C', calls: 17, agentId: 7 },
  '121': { name: 'Talha #C', calls: 17, agentId: 15 },
  '101': { name: 'Abdullah Abid', calls: 15, agentId: 11 },
  '111': { name: 'Rameen #A', calls: 11, agentId: 17 },
  '109': { name: 'Mahrukh #C', calls: 8, agentId: 8 },
  '105': { name: 'Farhat #C', calls: 6, agentId: 5 },
  '107': { name: 'Emir #B', calls: 6, agentId: 12 },
  '123': { name: 'Ayesha #C', calls: 5, agentId: 2 },
  '103': { name: 'Awais #B', calls: 4, agentId: 9 },
  '102': { name: 'Tayyab #C', calls: 2, agentId: 10 },
};