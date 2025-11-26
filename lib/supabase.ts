import { createClient } from '@supabase/supabase-js';

// Access environment variables safely
// Use a fallback object if import.meta.env is undefined to prevent crashes
const env = (import.meta as any).env || {};

// Cấu hình Supabase Real (Hardcoded for MVP/Production)
// Trong môi trường production chuyên nghiệp, bạn nên dùng biến môi trường (Environment Variables)
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://uthuigqlvjiscmdqvhxz.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0aHVpZ3Fsdmppc2NtZHF2aHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTExNzcsImV4cCI6MjA3OTY2NzE3N30.s3zIPwUNMchOQJVYdOeOI91HMOwoNVR4wdOhLwHGWJ8';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase Environment Variables. App will run in degraded mode.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);