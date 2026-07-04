import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const OPENWA_API_URL = process.env['OPENWA_API_URL'] || 'http://localhost:2785';
const OPENWA_API_KEY = process.env['OPENWA_API_KEY'] || '';
const OPENWA_SESSION_ID = process.env['OPENWA_SESSION_ID'] || 'placement-buddy';

async function main() {
  console.log('🤖 Fetching WhatsApp groups from OpenWA Gateway...');
  console.log(`📡 URL: ${OPENWA_API_URL}`);
  console.log(`🔑 Session ID: ${OPENWA_SESSION_ID}`);

  if (!OPENWA_API_KEY) {
    console.error('❌ Error: OPENWA_API_KEY is not set in your backend/.env file.');
    process.exit(1);
  }

  const url = `${OPENWA_API_URL}/api/sessions/${OPENWA_SESSION_ID}/groups`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': OPENWA_API_KEY,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ API Error (${res.status}): ${errText}`);
      process.exit(1);
    }

    const data = await res.json() as any;
    // OpenWA response returns list of groups as array in 'data' field or directly
    const groups = Array.isArray(data) ? data : data?.data || [];

    console.log('\n💬 --- Available WhatsApp Groups ---');
    if (groups.length === 0) {
      console.log('No groups found. Make sure the session is active and connected.');
    } else {
      groups.forEach((group: any) => {
        const name = group.name || group.formattedName || 'Unnamed Group';
        const id = group.id || group.chatId;
        console.log(`- Group Name: "${name}"`);
        console.log(`  Group ID:   ${id}`);
        console.log('------------------------------------');
      });
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Network or System Error:', error);
    process.exit(1);
  }
}

main();
