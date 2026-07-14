import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://cdzjhmukuxklwrxvynau.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkempobXVrdXhrbHdyeHZ5bmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTY0MDQsImV4cCI6MjA5ODM5MjQwNH0.gZaXs2Xuapc1Wmk8xQdxId2snzGWbXuIiRQRJhRLf8s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const dni = '74144095';
  const newPassword = '111111';

  // 1. Get current hash
  const { data: user, error: err1 } = await supabase.from('usuarios_sistema').select('password_hash').eq('dni_username', dni).single();
  if (err1) {
    console.error('Error fetching user:', err1);
    return;
  }
  console.log(`Current password_hash for ${dni}:`, user.password_hash);

  // 2. Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);
  console.log(`New hash for ${newPassword}:`, hash);

  // 3. Update the database
  const { error: err2 } = await supabase.from('usuarios_sistema').update({ password_hash: hash }).eq('dni_username', dni);
  if (err2) {
    console.error('Error updating password:', err2);
  } else {
    console.log(`Password for ${dni} updated successfully!`);
  }
}

main();
