// lib/ringcentral/client.ts
// RingCentral SDK client for fetching call analytics

import { SDK } from '@ringcentral/sdk';

// RingCentral client configuration
const clientId = process.env.RINGCENTRAL_CLIENT_ID!;
const clientSecret = process.env.RINGCENTRAL_CLIENT_SECRET!;
const serverURL = process.env.RINGCENTRAL_SERVER_URL || 'https://platform.ringcentral.com';

if (!clientId || !clientSecret) {
  throw new Error('Missing RingCentral credentials. Please check your environment variables.');
}

// Initialize RingCentral SDK
const rcsdk = new SDK({
  server: serverURL,
  clientId: clientId,
  clientSecret: clientSecret,
});

const platform = rcsdk.platform();

/**
 * Authenticate with RingCentral
 * Supports multiple authentication methods:
 * 1. JWT Token (preferred)
 * 2. Username/Password
 */
export async function authenticateRingCentral() {
  try {
    // Try JWT token first
    if (process.env.RINGCENTRAL_JWT_TOKEN) {
      await platform.login({ jwt: process.env.RINGCENTRAL_JWT_TOKEN });
      return platform;
    }

    // Fall back to username/password
    if (process.env.RINGCENTRAL_USERNAME && process.env.RINGCENTRAL_PASSWORD) {
      await platform.login({
        username: process.env.RINGCENTRAL_USERNAME,
        password: process.env.RINGCENTRAL_PASSWORD,
        extension: process.env.RINGCENTRAL_EXTENSION || '',
      });
      return platform;
    }

    throw new Error('No RingCentral authentication credentials found. Please set either RINGCENTRAL_JWT_TOKEN or RINGCENTRAL_USERNAME/PASSWORD');
  } catch (error: any) {
    console.error('[RingCentral] Authentication failed:', error.message);
    throw new Error(`RingCentral authentication failed: ${error.message}`);
  }
}

/**
 * Get call log data from RingCentral
 * @param options - Query options for filtering call logs
 */
export async function getCallLog(options: {
  dateFrom?: string; // ISO 8601 format
  dateTo?: string; // ISO 8601 format
  type?: 'Voice' | 'Fax'; // Call type
  direction?: 'Inbound' | 'Outbound'; // Call direction
  view?: 'Simple' | 'Detailed'; // Detail level
  perPage?: number; // Records per page (max 1000)
  page?: number; // Page number
} = {}) {
  try {
    // Ensure we're authenticated
    const auth = platform.auth();
    if (!auth || !(await auth.accessTokenValid())) {
      await authenticateRingCentral();
    }

    const response = await platform.get('/restapi/v1.0/account/~/call-log', {
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      type: options.type || 'Voice',
      direction: options.direction,
      view: options.view || 'Detailed',
      perPage: options.perPage || 1000,
      page: options.page || 1,
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[RingCentral] Failed to fetch call log:', error.message);
    throw new Error(`Failed to fetch call log: ${error.message}`);
  }
}

/**
 * Get call log data for a specific extension
 * @param extensionId - Extension ID (phone number extension)
 * @param options - Query options
 */
export async function getExtensionCallLog(
  extensionId: string,
  options: {
    dateFrom?: string;
    dateTo?: string;
    type?: 'Voice' | 'Fax';
    direction?: 'Inbound' | 'Outbound';
    perPage?: number;
    page?: number;
  } = {}
) {
  try {
    // Check if authenticated by trying to get auth data
    const authData = await platform.auth().data();
    if (!authData || !authData.access_token) {
      await authenticateRingCentral();
    }

    const response = await platform.get(
      `/restapi/v1.0/account/~/extension/${extensionId}/call-log`,
      {
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        type: options.type || 'Voice',
        direction: options.direction,
        perPage: options.perPage || 1000,
        page: options.page || 1,
      }
    );

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[RingCentral] Failed to fetch extension call log:', error.message);
    throw new Error(`Failed to fetch extension call log: ${error.message}`);
  }
}

/**
 * Get active call data (real-time)
 */
export async function getActiveCalls() {
  try {
    // Check if authenticated by trying to get auth data
    const authData = await platform.auth().data();
    if (!authData || !authData.access_token) {
      await authenticateRingCentral();
    }

    const response = await platform.get('/restapi/v1.0/account/~/active-calls', {
      view: 'Detailed',
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[RingCentral] Failed to fetch active calls:', error.message);
    throw new Error(`Failed to fetch active calls: ${error.message}`);
  }
}

/**
 * Get account extensions (users/phone numbers)
 */
export async function getExtensions() {
  try {
    // Check if authenticated by trying to get auth data
    const authData = await platform.auth().data();
    if (!authData || !authData.access_token) {
      await authenticateRingCentral();
    }

    const response = await platform.get('/restapi/v1.0/account/~/extension', {
      status: 'Enabled',
      perPage: 1000,
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[RingCentral] Failed to fetch extensions:', error.message);
    throw new Error(`Failed to fetch extensions: ${error.message}`);
  }
}

export { platform, rcsdk };
