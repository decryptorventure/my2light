import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('DEBUG: Loading env from:', path.resolve(process.cwd(), '.env.local'));
console.log('DEBUG: VITE_SUPABASE_URL exists:', !!supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables. Please check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('\n🧪 Testing Supabase Connection (Direct)...');

    // Test connection
    const { data, error } = await supabase.from('courts').select('count').limit(1);

    if (error) {
        console.error('❌ Connection failed:', error.message);
    } else {
        console.log('✅ Connection successful!');
        console.log('✅ Database query executed');
    }

    // Check tables
    const tables = ['profiles', 'courts', 'packages', 'bookings', 'highlights'];
    console.log('\nChecking tables...');
    for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (!error) console.log(`✅ Table '${t}' is ready`);
        else console.log(`❌ Table '${t}' error: ${error.message}`);
    }
}

test();
