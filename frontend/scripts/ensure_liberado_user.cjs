const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length > 0) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function ensureUser() {
  const { data: existingUser } = await supabase.from('usuarios_sistema').select('*').eq('dni_username', 'liberado_marz').single();
  if (existingUser) {
    console.log('User liberado_marz already exists:', existingUser);
    return existingUser;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('liberado_marz', salt);

  const newUser = {
    dni_username: 'liberado_marz',
    nombre_completo: 'liberado_marz',
    password_hash: passwordHash,
    area: 'LIQUIDACION',
    cargo_rol: 'LIQUIDACIONES',
    correo_institucional: 'liberado_marz@contechperu.pe',
    is_active: true
  };

  const { data: created, error } = await supabase.from('usuarios_sistema').insert(newUser).select().single();
  if (error) {
    console.error('Error creating user liberado_marz:', error);
    return null;
  }
  console.log('User liberado_marz created:', created);
  return created;
}

ensureUser().catch(console.error);
