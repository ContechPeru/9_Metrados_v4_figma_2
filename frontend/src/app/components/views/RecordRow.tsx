import { useState } from 'react';
import { Edit2, Save, X, Trash2 } from 'lucide-react';
import type { MetradoRecord } from '../../store/useMetradosStore';
import { useMetradosStore } from '../../store/useMetradosStore';

export function RecordRow({ record }: { record: MetradoRecord }) {
  const { updateMetrado, deleteMetrado } = useMetradosStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editValues, setEditValues] = useState({
    cant: record.cantidad_elementos || 1,
    long: record.medida_largo_area || 0,
    ancho: record.medida_ancho_empalme || 0,
    alt: record.medida_alto_gancho || 0,
    veces: record.nro_repeticiones || 1,
  });

  const handleUpdate = async () => {
    setIsSubmitting(true);
    
    const numCant = editValues.cant;
    const numLong = editValues.long;
    const numAncho = editValues.ancho;
    const numAlt = editValues.alt;
    
    const hasDims = numLong !== 0 || numAncho !== 0 || numAlt !== 0;
    const parcial = hasDims ? numCant * (numLong || 1) * (numAncho || 1) * (numAlt || 1) : numCant;
    const total = parcial * editValues.veces;

    const updates = {
      cantidad_elementos: numCant,
      medida_largo_area: numLong,
      medida_ancho_empalme: numAncho,
      medida_alto_gancho: numAlt,
      nro_repeticiones: editValues.veces,
      resultado_parcial: parcial,
      resultado_total: total
    };

    const res = await updateMetrado(record.id, updates);
    setIsSubmitting(false);
    if (res.success) {
      setIsEditing(false);
    } else {
      alert("Error actualizando: " + res.error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Seguro de eliminar este metrado?")) return;
    setIsSubmitting(true);
    const res = await deleteMetrado(record.id);
    if (!res.success) {
      alert("Error eliminando: " + res.error);
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-yellow-50/50 border-b border-gray-200">
        <td className="px-3 py-2 text-xs text-gray-500">{new Date(record.fecha_ejecucion).toLocaleDateString()}</td>
        <td className="px-3 py-2 text-xs font-mono">{record.snapshot_codigo}</td>
        <td className="px-3 py-2 text-xs text-gray-700 truncate max-w-xs">{record.snapshot_descripcion}</td>
        <td className="px-3 py-2 text-xs text-center">{record.unidad}</td>
        
        {/* Cajas de edición */}
        <td className="px-2 py-2">
          <input type="number" value={editValues.cant} onChange={e => setEditValues(p => ({...p, cant: parseFloat(e.target.value)||0}))} className="w-12 text-center border border-gray-300 rounded text-xs p-1" />
        </td>
        <td className="px-2 py-2">
          <input type="number" value={editValues.long} onChange={e => setEditValues(p => ({...p, long: parseFloat(e.target.value)||0}))} className="w-12 text-center border border-gray-300 rounded text-xs p-1" />
        </td>
        <td className="px-2 py-2">
          <input type="number" value={editValues.ancho} onChange={e => setEditValues(p => ({...p, ancho: parseFloat(e.target.value)||0}))} className="w-12 text-center border border-gray-300 rounded text-xs p-1" />
        </td>
        <td className="px-2 py-2">
          <input type="number" value={editValues.alt} onChange={e => setEditValues(p => ({...p, alt: parseFloat(e.target.value)||0}))} className="w-12 text-center border border-gray-300 rounded text-xs p-1" />
        </td>
        
        <td className="px-3 py-2 text-xs text-center bg-gray-100 font-bold">CALC</td>
        
        <td className="px-2 py-2">
          <input type="number" value={editValues.veces} onChange={e => setEditValues(p => ({...p, veces: parseFloat(e.target.value)||0}))} className="w-10 text-center border border-gray-300 rounded text-xs p-1" />
        </td>
        
        <td className="px-3 py-2 text-xs font-bold text-center bg-yellow-100">CALC</td>
        
        <td className="px-3 py-2 text-xs flex items-center justify-end gap-2">
          <button onClick={handleUpdate} disabled={isSubmitting} className="text-green-600 hover:bg-green-100 p-1 rounded disabled:opacity-50"><Save size={14} /></button>
          <button onClick={() => setIsEditing(false)} disabled={isSubmitting} className="text-gray-500 hover:bg-gray-200 p-1 rounded disabled:opacity-50"><X size={14} /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-blue-50/30 transition-colors border-b border-gray-100 group">
      <td className="px-3 py-2 text-xs text-gray-500">{new Date(record.fecha_ejecucion).toLocaleDateString()}</td>
      <td className="px-3 py-2 text-xs font-mono text-gray-600">{record.snapshot_codigo}</td>
      <td className="px-3 py-2 text-xs text-gray-800 truncate max-w-xs">{record.snapshot_descripcion}</td>
      <td className="px-3 py-2 text-xs text-center text-gray-500">{record.unidad}</td>
      
      <td className="px-3 py-2 text-xs text-center">{record.cantidad_elementos}</td>
      <td className="px-3 py-2 text-xs text-center text-gray-600">{record.medida_largo_area || '-'}</td>
      <td className="px-3 py-2 text-xs text-center text-gray-600">{record.medida_ancho_empalme || '-'}</td>
      <td className="px-3 py-2 text-xs text-center text-gray-600">{record.medida_alto_gancho || '-'}</td>
      <td className="px-3 py-2 text-xs text-center bg-gray-50 text-gray-800 font-mono">{record.resultado_parcial?.toFixed(2)}</td>
      <td className="px-3 py-2 text-xs text-center text-blue-600">{record.nro_repeticiones}</td>
      <td className="px-3 py-2 text-xs font-bold text-center bg-green-50 text-green-700 font-mono">{record.resultado_total?.toFixed(2)}</td>
      
      <td className="px-3 py-2 text-xs flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:bg-blue-100 p-1 rounded"><Edit2 size={14} /></button>
        <button onClick={handleDelete} disabled={isSubmitting} className="text-red-500 hover:bg-red-100 p-1 rounded disabled:opacity-50"><Trash2 size={14} /></button>
      </td>
    </tr>
  );
}
