require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles check:', error || 'Connected');
  
  // Try querying pg_class or information_schema? Not possible from REST API unless exposed.
}
run();
