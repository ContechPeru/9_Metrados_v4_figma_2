import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(Boolean).map(line => line.split('=')));

const supabaseUrl = env.VITE_SUPABASE_URL.trim();
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY.trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PESOS_ACERO: Record<string, number> = {
  "1/4": 0.254,
  "3/8": 0.560,
  "1/2": 0.994,
  "5/8": 1.550,
  "3/4": 2.240,
  "1": 3.970
};

async function main() {
  console.log("Fetching partidas...");
  const { data: partidas, error: errorP } = await supabase.from('catalogo_partidas').select('id, tipo_calculo, descripcion');
  if (errorP) throw errorP;

  const partidaMap = new Map(partidas.map(p => [p.id, p]));

  console.log("Fetching hvac factors...");
  const { data: hvacFactors, error: errorH } = await supabase.from('factores_hvac').select('*');
  if (errorH) throw errorH;

  const hvacMap = new Map(hvacFactors.map(h => [h.id, h]));

  console.log("Fetching all metrados (only relevant fields)...");
  let allMetrados: any[] = [];
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from('registro_metrados')
      .select('id, partida_id, cantidad_elementos, medida_largo_area, medida_ancho_empalme, medida_alto_gancho, nro_repeticiones, acero_diametro, hvac_item_id, resultado_parcial, resultado_total')
      .range(page * 1000, (page + 1) * 1000 - 1);
    
    if (error) throw error;
    if (data.length === 0) {
      hasMore = false;
    } else {
      allMetrados.push(...data);
      page++;
    }
  }

  console.log(`Total metrados fetched: ${allMetrados.length}`);
  
  let updatesCount = 0;
  const BATCH_SIZE = 50;

  let updatePromises = [];
  
  for (let i = 0; i < allMetrados.length; i++) {
    const m = allMetrados[i];
    
    const partida = partidaMap.get(m.partida_id);
    let tipo = partida?.tipo_calculo || 'Estandar';
    
    if (tipo === 'Estandar' || tipo === 'ESTANDAR') {
      if (m.acero_diametro) tipo = 'Acero';
      else if (m.hvac_item_id) tipo = 'HVAC';
    }

    const cant = m.cantidad_elementos || 0;
    const long = m.medida_largo_area || 0;
    const ancho = m.medida_ancho_empalme || 0;
    const alt = m.medida_alto_gancho || 0;
    const veces = m.nro_repeticiones || 1;

    let parcial = 0;

    tipo = tipo.toUpperCase();

    if (tipo === 'ACERO') {
      const c = cant;
      const longitudTotal = long + ancho + alt;
      if (c === 0 && longitudTotal === 0) {
        parcial = 0;
      } else {
        const factorKg = m.acero_diametro ? (PESOS_ACERO[m.acero_diametro] || 1) : 1;
        parcial = c * longitudTotal * factorKg;
      }
    } 
    else if (tipo === 'HVAC') {
      const c = cant > 0 ? cant : 1;
      let hvacItemType = '';
      let hvacFactor = 1;

      if (m.hvac_item_id) {
        const factor = hvacMap.get(m.hvac_item_id);
        if (factor) {
          hvacItemType = factor.label.toUpperCase();
          hvacFactor = Number(factor.factor);
        }
      } else if (partida) {
        hvacItemType = partida.descripcion.toUpperCase();
      }

      const usesLong = hvacItemType.includes('CODO') || hvacItemType.includes('DUCTO');
      const l = usesLong ? (long !== 0 ? long : 1) : 1;
      const a = ancho !== 0 ? ancho : 1;
      const h = alt !== 0 ? alt : 1;

      parcial = c * l * a * h * hvacFactor;
    } 
    else { // ESTANDAR
      const hasDims = long !== 0 || ancho !== 0 || alt !== 0;
      const l = long !== 0 ? long : 1;
      const a = ancho !== 0 ? ancho : 1;
      const h = alt !== 0 ? alt : 1;
      
      parcial = hasDims ? cant * l * a * h : cant;
    }

    const total = parcial * veces;

    if (m.resultado_parcial !== parcial || m.resultado_total !== total) {
      updatePromises.push(
        supabase.from('registro_metrados').update({
          resultado_parcial: parcial,
          resultado_total: total
        }).eq('id', m.id).then(({error}) => {
          if (error) console.error(`Error updating metrado ${m.id}`, error);
          else updatesCount++;
        })
      );
    }
    
    if (updatePromises.length >= BATCH_SIZE || i === allMetrados.length - 1) {
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Updated ${updatesCount} so far... (Processed ${i + 1}/${allMetrados.length})`);
        updatePromises = [];
      }
    }
  }

  console.log(`Updated ${updatesCount} metrados successfully.`);
}

main().catch(console.error);
