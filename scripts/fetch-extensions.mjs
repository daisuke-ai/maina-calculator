#!/usr/bin/env node
// Fetch RingCentral extensions to build extensionId → extensionNumber mapping
import { SDK } from '@ringcentral/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function fetchExtensions() {
  console.log('='.repeat(80));
  console.log('FETCHING RINGCENTRAL EXTENSIONS');
  console.log('='.repeat(80));

  const rcsdk = new SDK({
    server: process.env.RINGCENTRAL_SERVER_URL,
    clientId: process.env.RINGCENTRAL_CLIENT_ID,
    clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET,
  });

  const platform = rcsdk.platform();

  // Login
  await platform.login({
    jwt: process.env.RINGCENTRAL_JWT_TOKEN,
  });

  console.log('✅ Authenticated\n');

  // Fetch all extensions
  console.log('Fetching extensions list...\n');

  const response = await platform.get('/restapi/v1.0/account/~/extension', {
    perPage: 1000,
    status: 'Enabled'
  });

  const data = await response.json();
  const extensions = data.records || [];

  console.log(`Found ${extensions.length} extensions\n`);

  // Build mapping
  const mapping = {};
  const reverseMapping = {};

  console.log('Extension Mappings:');
  console.log('-'.repeat(80));

  extensions
    .filter(ext => ext.extensionNumber && ext.type === 'User')
    .forEach(ext => {
      mapping[ext.id] = ext.extensionNumber;
      reverseMapping[ext.extensionNumber] = ext.id;

      console.log(
        `Ext ${ext.extensionNumber.padEnd(5)} | ID: ${ext.id.toString().padEnd(12)} | ${ext.name || 'Unknown'}`
      );
    });

  // Save to file
  const mappingData = {
    extensionIdToNumber: mapping,
    extensionNumberToId: reverseMapping,
    fetchedAt: new Date().toISOString(),
    totalExtensions: Object.keys(mapping).length,
  };

  const filePath = join(__dirname, '..', 'config', 'extension-id-mapping.json');
  fs.writeFileSync(filePath, JSON.stringify(mappingData, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log(`✅ Saved ${Object.keys(mapping).length} extension mappings to:`);
  console.log(`   ${filePath}`);
  console.log('='.repeat(80));

  // Generate TypeScript config
  console.log('\nGenerating TypeScript mapping...');

  const tsContent = `// Auto-generated extension ID to number mapping
// Generated: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Run: node scripts/fetch-extensions.mjs

export const EXTENSION_ID_TO_NUMBER: Record<string, string> = ${JSON.stringify(mapping, null, 2)};

export const EXTENSION_NUMBER_TO_ID: Record<string, number> = ${JSON.stringify(reverseMapping, null, 2)};

export function getExtensionNumberById(extensionId: string | number | undefined | null): string | null {
  if (!extensionId) return null;
  return EXTENSION_ID_TO_NUMBER[extensionId.toString()] || null;
}

export function getExtensionIdByNumber(extensionNumber: string | undefined | null): string | null {
  if (!extensionNumber) return null;
  const id = EXTENSION_NUMBER_TO_ID[extensionNumber];
  return id ? id.toString() : null;
}
`;

  const tsPath = join(__dirname, '..', 'config', 'extension-id-mapping.ts');
  fs.writeFileSync(tsPath, tsContent);

  console.log(`✅ Saved TypeScript mapping to:`);
  console.log(`   ${tsPath}\n`);
}

fetchExtensions().catch(console.error);
