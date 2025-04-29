
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import appConfig from '@/config/appConfig';

const SUPABASE_URL = appConfig.api.supabase.url;
const SUPABASE_PUBLISHABLE_KEY = appConfig.api.supabase.key;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
