import { createClient } from "@supabase/supabase-js";

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === "true";

const noopClient = {
  channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
  removeChannel: () => {},
};

export const supabase = MOCK_MODE
  ? noopClient
  : createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);
