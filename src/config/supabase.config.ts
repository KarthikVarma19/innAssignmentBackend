import { createClient } from "@supabase/supabase-js";
import { config } from "../env";

export const supabase = createClient(config.SUPABASE_API_URL, config.SUPABASE_API_KEY);

export async function checkSupabaseConnection() {
  try {
    await supabase.storage.listBuckets();
    console.log("Supabase Connected");
  } catch (err) {
    console.error("Supabase connection failed:", err);
  }
}
