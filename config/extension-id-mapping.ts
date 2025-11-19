// Auto-generated extension ID to number mapping
// Generated: 2025-11-19T18:50:43.695Z
// DO NOT EDIT MANUALLY - Run: node scripts/fetch-extensions.mjs

export const EXTENSION_ID_TO_NUMBER: Record<string, string> = {
  "156801053": "102",
  "156881053": "106",
  "156992053": "108",
  "157001053": "103",
  "191579052": "101",
  "192345052": "104",
  "192346052": "105",
  "192348052": "107",
  "192351052": "110",
  "192431052": "111",
  "192432052": "113",
  "192433052": "114",
  "192435052": "117",
  "192436052": "118",
  "192437052": "119",
  "195538052": "120",
  "195548052": "121",
  "195621052": "109",
  "231855052": "122",
  "234521052": "123"
};

export const EXTENSION_NUMBER_TO_ID: Record<string, string> = {
  "101": 191579052,
  "102": 156801053,
  "103": 157001053,
  "104": 192345052,
  "105": 192346052,
  "106": 156881053,
  "107": 192348052,
  "108": 156992053,
  "109": 195621052,
  "110": 192351052,
  "111": 192431052,
  "113": 192432052,
  "114": 192433052,
  "117": 192435052,
  "118": 192436052,
  "119": 192437052,
  "120": 195538052,
  "121": 195548052,
  "122": 231855052,
  "123": 234521052
};

export function getExtensionNumberById(extensionId: string | number | undefined | null): string | null {
  if (!extensionId) return null;
  return EXTENSION_ID_TO_NUMBER[extensionId.toString()] || null;
}

export function getExtensionIdByNumber(extensionNumber: string | undefined | null): string | null {
  if (!extensionNumber) return null;
  return EXTENSION_NUMBER_TO_ID[extensionNumber] || null;
}
