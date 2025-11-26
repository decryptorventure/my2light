import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env vars if in Node.js environment (for testing scripts)
if (typeof process !== 'undefined' && process.env && !import.meta) {
  dotenv.config({ path: '.env.local' });
}

// Get Supabase credentials
// Support both Vite (import.meta.env) and Node.js (process.env)
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') as string;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') as string;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
  // Only throw in browser/app, allow script to handle error gracefully if needed
  if (typeof window !== 'undefined') {
    throw new Error('Supabase configuration is missing. Check your .env.local file.');
  }
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');