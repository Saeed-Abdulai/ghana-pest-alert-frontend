// import { createClient } from '@supabase/supabase-js';


// // Initialize database client
// const supabaseUrl = 'https://njxbmmptpuazvptgwkbk.databasepad.com';
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjQzZDdhZWY4LWM4NzctNGE1Mi05NjhjLWNlY2I1NWQwZmNkNiJ9.eyJwcm9qZWN0SWQiOiJuanhibW1wdHB1YXp2cHRnd2tiayIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY3NTI4ODc2LCJleHAiOjIwODI4ODg4NzYsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.OTX5jspnKCYDKS4EYeDPU9bzOFxBdTCwVHxdZXzYeQU';
// const supabase = createClient(supabaseUrl, supabaseKey);


// export { supabase }; 

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("SUPABASE URL:", supabaseUrl);
console.log("SUPABASE KEY EXISTS:", Boolean(supabaseAnonKey));

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase env vars missing. Check .env and restart npm run dev.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// ================= TEMP DEBUG TRAP =================
// This will show exactly which file is still calling Edge Functions
const originalInvoke = supabase.functions.invoke.bind(supabase.functions);

supabase.functions.invoke = async (...args: any[]) => {
  console.error('EDGE FUNCTION INVOKE CALLED:', args?.[0]);
  console.trace('STACK TRACE (shows file + line number)');
  return originalInvoke(...args);
};
// ================= END TEMP DEBUG TRAP =================
