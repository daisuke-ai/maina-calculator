// scripts/test-ringcentral-raw.mjs
// Test RingCentral API to see raw response structure
import { SDK } from '@ringcentral/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const clientId = process.env.RINGCENTRAL_CLIENT_ID;
const clientSecret = process.env.RINGCENTRAL_CLIENT_SECRET;
const serverURL = process.env.RINGCENTRAL_SERVER_URL || 'https://platform.ringcentral.com';
const jwtToken = process.env.RINGCENTRAL_JWT_TOKEN;

console.log('\\n🔐 Testing RingCentral Raw API Response\\n');

const sdk = new SDK({
  server: serverURL,
  clientId: clientId,
  clientSecret: clientSecret,
});

const platform = sdk.platform();

async function testRawAPI() {
  try {
    // Authenticate with JWT
    await platform.login({
      jwt: jwtToken,
    });

    console.log('✅ Authentication successful!\\n');

    // Fetch call logs for Nov 17
    console.log('🔄 Fetching call logs for Nov 17, 2025...\\n');
    const response = await platform.get('/restapi/v1.0/account/~/call-log', {
      dateFrom: '2025-11-17T00:00:00.000Z',
      dateTo: '2025-11-17T23:59:59.999Z',
      perPage: 5,
      view: 'Detailed'
    });

    const data = await response.json();
    console.log(`Total calls available: ${data.paging?.totalElements || 0}`);
    console.log(`Fetched records: ${data.records?.length || 0}\\n`);

    if (data.records && data.records.length > 0) {
      console.log('\\n📞 Sample Call Record (Full Structure):\\n');
      const firstCall = data.records[0];

      // Pretty print the first call
      console.log(JSON.stringify(firstCall, null, 2));

      console.log('\\n🔍 Key Fields Analysis:\\n');
      console.log('Direction:', firstCall.direction);
      console.log('Result:', firstCall.result);
      console.log('Duration:', firstCall.duration, 'seconds');

      console.log('\\nFROM:');
      console.log('  phoneNumber:', firstCall.from?.phoneNumber);
      console.log('  extensionNumber:', firstCall.from?.extensionNumber);
      console.log('  extensionId:', firstCall.from?.extensionId);
      console.log('  name:', firstCall.from?.name);

      console.log('\\nTO:');
      console.log('  phoneNumber:', firstCall.to?.phoneNumber);
      console.log('  extensionNumber:', firstCall.to?.extensionNumber);
      console.log('  extensionId:', firstCall.to?.extensionId);
      console.log('  name:', firstCall.to?.name);

      console.log('\\nLEGS (if any):');
      if (firstCall.legs && firstCall.legs.length > 0) {
        for (let i = 0; i < Math.min(2, firstCall.legs.length); i++) {
          const leg = firstCall.legs[i];
          console.log(`\\nLeg ${i + 1}:`);
          console.log('  direction:', leg.direction);
          console.log('  legType:', leg.legType);
          console.log('  extension:', leg.extension);
          console.log('  from.extensionNumber:', leg.from?.extensionNumber);
          console.log('  to.extensionNumber:', leg.to?.extensionNumber);
        }
      }

      // Check extension field at root level
      console.log('\\nEXTENSION (root level):');
      console.log('  id:', firstCall.extension?.id);
      console.log('  uri:', firstCall.extension?.uri);
    }

  } catch (error) {
    console.error('❌ Error!\\n');
    console.error('Message:', error.message);
    if (error.response) {
      try {
        const errorData = await error.response.json();
        console.error('Details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('Response status:', error.response.status);
      }
    }
  }
}

testRawAPI();