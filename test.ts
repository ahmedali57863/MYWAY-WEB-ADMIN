import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('driver_applications').select('*, profiles:user_id(full_name), vehicles:vehicle_id(*)').eq('status', 'pending');
  console.log(JSON.stringify({data, error}, null, 2));
}
test();
