import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const VERIFICATION_BUCKET = "vendor-verification-documents";

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function ensureVerificationBucket() {
  const supabase = getSupabaseAdmin();
  const { data: bucket } = await supabase.storage.getBucket(VERIFICATION_BUCKET);
  if (!bucket) {
    const { error } = await supabase.storage.createBucket(VERIFICATION_BUCKET, { public: false, fileSizeLimit: "10485760" });
    if (error && !error.message.toLowerCase().includes("already exists")) throw error;
  }
  return supabase;
}
