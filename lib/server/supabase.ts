import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextApiRequest } from "next";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);
const fetchWithTimeout: typeof fetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) });

export function publicSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { global: { fetch: fetchWithTimeout }, auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticatedSupabase(req: NextApiRequest): Promise<{ client: SupabaseClient; user: User } | null> {
  if (!url || !anonKey) return null;
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return null;
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` }, fetch: fetchWithTimeout },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return { client, user: data.user };
}
