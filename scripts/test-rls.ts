
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLS() {
    console.log('🔒 Testing RLS Policies...\n');

    // 1. Test Public Access to Profiles
    console.log('1. Testing Public Access to Profiles...');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .limit(5);

    if (profileError) {
        console.error('❌ Failed to fetch profiles:', profileError.message);
    } else {
        console.log(`✅ Successfully fetched ${profiles.length} profiles (Public Read OK)`);
    }

    // 2. Test Public Access to Courts
    console.log('\n2. Testing Public Access to Courts...');
    const { data: courts, error: courtError } = await supabase
        .from('courts')
        .select('id, name')
        .limit(5);

    if (courtError) {
        console.error('❌ Failed to fetch courts:', courtError.message);
    } else {
        console.log(`✅ Successfully fetched ${courts.length} courts (Public Read OK)`);
    }

    // 3. Test Unauthorized Insert (Should Fail)
    console.log('\n3. Testing Unauthorized Insert to Bookings...');
    const { error: insertError } = await supabase
        .from('bookings')
        .insert({
            court_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
            user_id: '00000000-0000-0000-0000-000000000000',
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString(),
            total_price: 100000
        });

    if (insertError) {
        console.log('✅ Unauthorized insert blocked as expected:', insertError.message);
    } else {
        console.error('❌ Unauthorized insert succeeded! RLS is NOT working correctly.');
    }

    console.log('\n🏁 RLS Test Completed.');
}

testRLS();
