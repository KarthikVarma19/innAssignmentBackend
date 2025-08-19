import { createClient } from "@supabase/supabase-js";
import { APP_CONFIG } from "../env";

export const supabase = createClient(APP_CONFIG.SUPABASE_API_URL, APP_CONFIG.SUPABASE_API_KEY);

export async function verifySupabaseServiceConnection() {
  try {
    await supabase.storage.listBuckets();
    console.log("Supabase Connected");
  } catch (err) {
    console.error("Supabase connection failed:", err);
  }
}
