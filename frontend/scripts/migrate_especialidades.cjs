const { Client } = require('pg');

const connectionString = 'postgresql://postgres.smnhkhceihcbagecqlth:Jo.98395145002@aws-1-us-west-2.pooler.supabase.com:6543/postgres';

async function migrate() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      ALTER TABLE cuadrillas ADD COLUMN IF NOT EXISTS especialidades TEXT[] DEFAULT '{}'::TEXT[];
    `);
    
    console.log('Column especialidades added successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
