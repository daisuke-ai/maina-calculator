// config/ringcentral-mapping.ts
// Maps RingCentral phone numbers and extensions to our agent IDs

export const RINGCENTRAL_AGENT_MAPPING: Record<string, number> = {
  // Extension-based mapping (preferred - more reliable)
  // Based on actual RingCentral data as of 2025-01-18
  '101': 11, // Abdullah Abid (Noyaan) - email mismatch but same person
  '102': 10, // Tayyab (Burakh)
  '103': 9,  // Awais (Ozan)
  '104': 6,  // Masoumah (Lina)
  '105': 5,  // Farhat
  '106': 16, // Fatima (Eleena)
  '107': 12, // Emir
  '108': 7,  // Faizan (Fazil)
  '109': 8,  // Mahrukh (Mina)
  '110': 25, // Mian (Operations)
  '111': 17, // Rameen (Ayla)
  '113': 21, // Laiba (Eda)
  '114': 3,  // Eman (Elif)
  '117': 28, // English Issue (Support)
  '118': 26, // Ifaf Shahab
  '119': 27, // Shahab Javed
  '120': 19, // Hannan
  '121': 15, // Talha (Tabeeb)
  '122': 20, // Mishaal (Anna)
  '123': 2,  // Ayesha (Ada)
};

// Phone number mapping (backup - use if extension not available)
export const PHONE_TO_AGENT_MAPPING: Record<string, number> = {
  // Format: last 4 digits -> agent ID
  // From actual RingCentral direct numbers

  '2010': 11, // (661) 596-2010 - Abdullah (Noyaan)
  '2409': 10, // (661) 596-2409 - Tayyab (Burakh)
  '2522': 9,  // (661) 596-2522 - Awais (Ozan)
  '2746': 6,  // (661) 596-2746 - Masoumah (Lina)
  '2945': 5,  // (661) 596-2945 - Farhat
  '2959': 16, // (661) 596-2959 - Fatima (Eleena)
  '0319': 12, // (661) 605-0319 - Emir
  '0324': 7,  // (661) 605-0324 - Faizan (Fazil)
  '0328': 8,  // (661) 605-0328 - Mahrukh (Mina)
  '0329': 25, // (661) 605-0329 - Mian (Operations)
  '5757': 17, // (559) 218-5757 - Rameen (Ayla)
  '5524': 21, // (559) 218-5524 - Laiba (Eda)
  '0470': 3,  // (559) 286-0470 - Eman (Elif)
  '7202': 28, // (559) 206-7202 - English Issue
  '2021': 26, // (559) 421-2021 - Ifaf Shahab
  '0778': 27, // (559) 570-0778 - Shahab Javed
  '0509': 19, // (559) 286-0509 - Hannan
  '6681': 15, // (559) 317-6681 - Talha (Tabeeb)
  '5856': 20, // (559) 777-5856 - Mishaal (Anna)
  '5113': 2,  // (559) 777-5113 - Ayesha (Ada)
};

/**
 * Get agent ID from RingCentral extension number
 */
export function getAgentIdFromExtension(extension: string | undefined): number | null {
  if (!extension) return null;
  return RINGCENTRAL_AGENT_MAPPING[extension] || null;
}

/**
 * Get agent ID from phone number
 * Tries multiple formats and fallbacks
 */
export function getAgentIdFromPhone(phoneNumber: string | undefined): number | null {
  if (!phoneNumber) return null;

  // Clean phone number
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Try last 4 digits
  const last4 = cleaned.slice(-4);
  const agentId = PHONE_TO_AGENT_MAPPING[last4];

  if (agentId && agentId > 0) {
    return agentId;
  }

  return null;
}

/**
 * Get agent ID from call record
 * Tries extension first, then phone number
 */
export function getAgentIdFromCallRecord(
  extensionNumber: string | undefined,
  phoneNumber: string | undefined
): number | null {
  // Try extension first (more reliable)
  const fromExtension = getAgentIdFromExtension(extensionNumber);
  if (fromExtension) return fromExtension;

  // Fall back to phone number
  return getAgentIdFromPhone(phoneNumber);
}
