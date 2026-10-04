import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let signInPromise: Promise<string | null> | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) browserClient = createClient(url, key, { global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) } });
  return browserClient;
}

export async function getAccessToken(): Promise<string | null> {
  const client = getBrowserSupabase();
  if (!client) return null;
  const { data: { session }, error } = await client.auth.getSession();
  if (error) throw error;
  if (session?.access_token) return session.access_token;
  if (!signInPromise) {
    signInPromise = client.auth.signInAnonymously().then(({ data, error: signInError }) => {
      if (signInError) throw signInError;
      return data.session?.access_token ?? null;
    }).finally(() => { signInPromise = null; });
  }
  return signInPromise;
}
