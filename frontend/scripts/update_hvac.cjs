const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function updateHvac() {
  const hvacCodes = [
    'OE.5.6.16.5.7',
    'OE.5.6.16.5.8',
    'OE.5.6.16.5.11.1',
    'OE.5.6.16.5.11.2',
    'OE.5.6.16.5.11.5'
  ];
  
  // Need service role key to update without RLS? Or we can just use the anon key if RLS allows.
  // We already saw anon key has some access, but let's see if we can update.
  // Actually, we have the service role key from previous scripts! Wait, do we?
  // I will check if anon key works.
  
  const { data, error } = await supabase
    .from('catalogo_partidas')
    .update({ tipo_calculo: 'HVAC' })
    .in('codigo_expediente', hvacCodes);
    
  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Updated successfully!');
  }
}

updateHvac();
