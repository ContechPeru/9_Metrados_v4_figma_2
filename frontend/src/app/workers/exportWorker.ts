import { buildWorkbook as buildLiquid } from '../lib/exportLiquid';
import { buildWorkbook as buildMetrados } from '../lib/exportMetrados';

self.onmessage = async (e: MessageEvent) => {
  try {
    const { type, datos, filtros, logoBuffer } = e.data;
    let wb;

    if (type === 'LIQUID') {
      wb = await buildLiquid(datos, filtros);
    } else if (type === 'METRADOS') {
      wb = await buildMetrados(datos, logoBuffer);
    } else {
      throw new Error('Tipo de exportación no soportado por el worker.');
    }

    const buffer = await wb.xlsx.writeBuffer();
    self.postMessage({ success: true, buffer });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};
