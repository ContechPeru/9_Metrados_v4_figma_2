const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function resetPasswords() {
  const newPassword = '1111';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);
  
  const { data, error } = await supabase
    .from('usuarios_sistema')
    .update({ password_hash: hash })
    .eq('cargo_rol', 'METRADOR');
    
  if (error) {
    console.error('Error resetting passwords:', error);
  } else {
    console.log('Successfully reset passwords for all METRADOR users to "1111"');
  }
}

resetPasswords();
