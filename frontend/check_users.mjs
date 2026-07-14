import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cdzjhmukuxklwrxvynau.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkempobXVrdXhrbHdyeHZ5bmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTY0MDQsImV4cCI6MjA5ODM5MjQwNH0.gZaXs2Xuapc1Wmk8xQdxId2snzGWbXuIiRQRJhRLf8s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('usuarios_sistema').select('*');
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log(`There are ${data.length} users in the database.`);
    if (data.length > 0) {
      console.log('Users found:', data.map(u => u.dni_username).join(', '));
    }
  }
}

main();
