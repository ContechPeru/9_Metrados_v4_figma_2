const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function updateAcero() {
  const codes = [
    'OE.2.3.2.3', 'OE.2.3.3.3', 'OE.2.3.3.4', 'OE.2.3.4.3', 'OE.2.3.4.4',
    'OE.2.3.5.3', 'OE.2.3.5.4', 'OE.2.3.20.2', 'OE.2.3.9.8.2', 'OE.2.3.9.8.3',
    'OE.2.3.7.3', 'OE.2.3.7.8', 'OE.2.3.7.6', 'OE.2.3.7.11', 'OE.2.3.6.2.3',
    'OE.2.3.6.2.4', 'OE.2.3.6.3.3', 'OE.2.3.6.5.1', 'OE.2.3.6.4.2', 'OE.2.3.8.3',
    'OE.2.3.8.8', 'OE.2.3.8.6', 'OE.2.3.8.11', 'OE.2.3.9.1.3', 'OE.2.3.9.1.5',
    'OE.2.3.9.2.3', 'OE.2.3.9.2.9', 'OE.2.3.6.1.3', 'OE.2.3.6.1.7', 'OE.2.3.6.4.9',
    'OE.2.3.6.5.6', 'OE.2.3.9.10.3', 'OE.2.3.9.10.5', 'OE.2.3.9.9.3', 'OE.2.3.9.9.5',
    'OE.2.3.21.1', 'OE.2.3.6.3.4', 'OE.2.3.12.3', 'OE.2.3.12.4', 'OE.2.3.18.3',
    'OE.2.3.18.11', 'OE.2.3.19.3', 'OE.2.3.19.5', 'OE.2.3.22.1', 'OE.2.3.6.4.6',
    'OE.4.5.2.11.3', 'OE.4.9.13.7', 'OE.5.2.6.3.3', 'OE.6.4.7', 'OE.2.6.4.4',
    'OE.2.6.4.5', 'OE.2.6.4.9', 'OE.2.6.4.10', 'OE.2.6.4.12', 'OE.1.1.1.23'
  ];
  
  // Dividiremos en batches por si hay algún límite de supabase
  for (let i = 0; i < codes.length; i += 10) {
    const batch = codes.slice(i, i + 10);
    const { data, error } = await supabase
      .from('catalogo_partidas')
      .update({ tipo_calculo: 'ACERO' })
      .in('codigo_expediente', batch);
      
    if (error) {
      console.error('Error updating batch:', error);
    } else {
      console.log(`Updated batch ${i/10 + 1}`);
    }
  }
  
  console.log('Update complete!');
}

updateAcero();
