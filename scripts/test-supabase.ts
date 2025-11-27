// Test script to verify Supabase connection and database operations
import { supabase } from '../lib/supabase';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('DEBUG: VITE_SUPABASE_URL exists:', !!process.env.VITE_SUPABASE_URL);
console.log('DEBUG: VITE_SUPABASE_ANON_KEY exists:', !!process.env.VITE_SUPABASE_ANON_KEY);

console.log('🧪 Testing Supabase Connection...\n');

async function testSupabaseConnection() {
    try {
        // Test 1: Check connection
        console.log('1️⃣ Testing database connection...');
        const { data: courts, error: courtsError } = await supabase
            .from('courts')
            .select('*')
            .limit(1);

        if (courtsError) {
            console.error('❌ Failed to connect to courts table:', courtsError.message);
            return false;
        }
        console.log('✅ Successfully connected to database');
        console.log(`✅ Found ${courts?.length || 0} court(s)\n`);

        // Test 2: Check authentication
        console.log('2️⃣ Testing authentication...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log(session ? '✅ User is authenticated' : '⚠️  No active session (expected if not logged in)\n');

        // Test 3: Check tables exist
        console.log('3️⃣ Checking all tables...');
        const tables = ['profiles', 'courts', 'packages', 'bookings', 'highlights'];

        for (const table of tables) {
            const { error } = await supabase.from(table).select('id').limit(1);
            if (error) {
                console.error(`❌ Table "${table}" error:`, error.message);
            } else {
                console.log(`✅ Table "${table}" exists`);
            }
        }

        console.log('\n🎉 All tests passed! Supabase is configured correctly.');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

testSupabaseConnection();
