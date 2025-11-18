// scripts/test-ringcentral-auth.mjs
// Test RingCentral authentication and get access token

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

console.log('\n🔐 Testing RingCentral JWT Authentication\n');
console.log('Configuration:');
console.log('- Server:', serverURL);
console.log('- Client ID:', clientId);
console.log('- JWT Token:', jwtToken ? `${jwtToken.substring(0, 50)}...` : 'Not set');
console.log('\n');

const sdk = new SDK({
  server: serverURL,
  clientId: clientId,
  clientSecret: clientSecret,
});

const platform = sdk.platform();

async function testAuth() {
  try {
    console.log('🔄 Attempting JWT authentication...\n');

    // Try JWT grant
    const response = await platform.login({
      jwt: jwtToken,
    });

    console.log('✅ Authentication successful!\n');

    const authData = await platform.auth().data();
    console.log('Access Token:', authData.access_token.substring(0, 50) + '...');
    console.log('Expires in:', authData.expires_in, 'seconds');
    console.log('Refresh Token:', authData.refresh_token ? 'Present' : 'None');
    console.log('\n');

    // Test API call
    console.log('🔄 Testing API call (fetching account info)...\n');
    const apiResponse = await platform.get('/restapi/v1.0/account/~');
    const accountData = await apiResponse.json();

    console.log('✅ API call successful!');
    console.log('Account ID:', accountData.id);
    console.log('Company Name:', accountData.serviceInfo?.brand?.name || 'N/A');
    console.log('\n');

    // Try fetching call logs
    console.log('🔄 Testing call log access...\n');
    const callLogResponse = await platform.get('/restapi/v1.0/account/~/call-log', {
      perPage: 5,
      view: 'Simple'
    });
    const callLogData = await callLogResponse.json();

    console.log('✅ Call log access successful!');
    console.log('Total calls available:', callLogData.paging?.totalElements || 0);
    console.log('Fetched records:', callLogData.records?.length || 0);

    if (callLogData.records && callLogData.records.length > 0) {
      console.log('\nSample call:');
      const firstCall = callLogData.records[0];
      console.log('- Direction:', firstCall.direction);
      console.log('- Type:', firstCall.type);
      console.log('- Duration:', firstCall.duration, 'seconds');
      console.log('- Date:', new Date(firstCall.startTime).toLocaleString());
    }

    console.log('\n✅ All tests passed! Your RingCentral integration is working.\n');
    console.log('You can now use the sync API to import call data.\n');

  } catch (error) {
    console.error('❌ Authentication failed!\n');
    console.error('Error:', error.message);

    if (error.response) {
      try {
        const errorData = await error.response.json();
        console.error('\nDetails:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('Response status:', error.response.status);
      }
    }

    console.log('\n');
    console.log('Troubleshooting:');
    console.log('1. Check your JWT token is correct and not expired');
    console.log('2. Verify the app has "JWT Bearer" grant type enabled in RingCentral Developer Portal');
    console.log('3. Go to: https://developers.ringcentral.com/my-account.html');
    console.log('4. Click on your app > Settings > Auth Settings');
    console.log('5. Enable "JWT Bearer" grant type and regenerate the token');
    console.log('\n');

    process.exit(1);
  }
}

testAuth();
