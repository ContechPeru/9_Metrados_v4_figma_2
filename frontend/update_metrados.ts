import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltmxbfdlnaelharzkuyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bXhiZmRsbmFlbGhhcnprdXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTQ4MzAsImV4cCI6MjA5OTYzMDgzMH0.D32wHC7DK4aSPtu-c-9zpSyBTIQvPezXPH0okPh13wQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching rows from ADMINISTRADOR 1...');
  const { data, error } = await supabase
    .from('registro_metrados')
    .select('id, elemento_desc, detalle_desc')
    .eq('firma_ingeniero', 'ADMINISTRADOR 1');

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  const toUpdate = data.filter(row => row.detalle_desc === row.elemento_desc && row.detalle_desc != null && row.detalle_desc !== '');
  
  console.log(`Found ${toUpdate.length} rows where detalle_desc equals elemento_desc.`);

  if (toUpdate.length === 0) {
    console.log('No rows to update.');
    return;
  }

  let updatedCount = 0;
  for (const row of toUpdate) {
    const { error: updateError } = await supabase
      .from('registro_metrados')
      .update({ detalle_desc: '' })
      .eq('id', row.id);

    if (updateError) {
      console.error(`Error updating row ${row.id}:`, updateError);
    } else {
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} rows.`);
}

run();
