const { Client } = require('pg');

const connectionString = 'postgresql://postgres.smnhkhceihcbagecqlth:Jo.98395145002@aws-1-us-west-2.pooler.supabase.com:6543/postgres';

async function migrate() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS cuadrillas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre TEXT UNIQUE NOT NULL,
          descripcion TEXT,
          estado_activo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );

      CREATE TABLE IF NOT EXISTS obreros_cuadrillas (
          obrero_id UUID REFERENCES personal_obrero(id) ON DELETE CASCADE,
          cuadrilla_id UUID REFERENCES cuadrillas(id) ON DELETE CASCADE,
          PRIMARY KEY (obrero_id, cuadrilla_id)
      );
    `);
    console.log('Tables created');

    // Enable RLS and public access to simplify just like the rest of the tables
    await client.query(`
      ALTER TABLE cuadrillas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE obreros_cuadrillas ENABLE ROW LEVEL SECURITY;
      
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'cuadrillas'
          ) THEN
              CREATE POLICY "Public Access" ON cuadrillas FOR ALL USING (true);
          END IF;
          
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'obreros_cuadrillas'
          ) THEN
              CREATE POLICY "Public Access" ON obreros_cuadrillas FOR ALL USING (true);
          END IF;
      END
      $$;
    `);
    console.log('RLS policies enabled');

    // 2. Migrate data
    const res = await client.query('SELECT id, cuadrilla FROM personal_obrero WHERE cuadrilla IS NOT NULL AND cuadrilla != \'\'');
    const obreros = res.rows;
    console.log(`Found ${obreros.length} obreros with existing cuadrilla text`);

    const cuadrillaNames = new Set();
    obreros.forEach(o => {
      // Sometimes multiple cuadrillas might be comma separated, but typically it was single text
      const name = o.cuadrilla.trim();
      if (name && name !== 'Sin asignar') {
        cuadrillaNames.add(name);
      }
    });

    console.log(`Found unique cuadrillas:`, Array.from(cuadrillaNames));

    for (const name of cuadrillaNames) {
      await client.query('INSERT INTO cuadrillas (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING', [name]);
    }
    console.log('Inserted master cuadrillas');

    // Create relation map
    const cuadrillasRes = await client.query('SELECT id, nombre FROM cuadrillas');
    const cuadrillaMap = {};
    cuadrillasRes.rows.forEach(c => {
      cuadrillaMap[c.nombre] = c.id;
    });

    let relationsInserted = 0;
    for (const o of obreros) {
      const name = o.cuadrilla.trim();
      const cuadrillaId = cuadrillaMap[name];
      if (cuadrillaId) {
        await client.query(`
          INSERT INTO obreros_cuadrillas (obrero_id, cuadrilla_id) 
          VALUES ($1, $2) 
          ON CONFLICT DO NOTHING
        `, [o.id, cuadrillaId]);
        relationsInserted++;
      }
    }
    console.log(`Inserted ${relationsInserted} relations into obreros_cuadrillas`);
    
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
