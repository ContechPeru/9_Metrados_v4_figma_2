import React, { useState, useMemo, useRef } from 'react';
import { useMetradosStore, type MetradoRecord, type Partida } from '../../store/useMetradosStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ChevronRight, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface MetradosTreeGridProps {
  metrados: MetradoRecord[];
  partidas: Partida[];
  onEdit: (m: MetradoRecord) => void;
  onDelete: (m: MetradoRecord) => void;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  groupByDate?: 'none' | 'desc' | 'asc';
  viewMode?: 'Detallada' | 'Resumida' | 'Valorizada';
}

// Custom hook to keep callbacks stable
function useLatestCallbacks<T extends Record<string, any>>(callbacks: T) {
  const ref = React.useRef(callbacks);
  ref.current = callbacks;
  return ref;
}

interface PartidaRowProps {
  node: TreeNode;
  depth: number;
  dateGroup: string;
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
  viewMode: 'Detallada' | 'Resumida' | 'Valorizada';
  index: number;
  measureRef: any;
}

const PartidaRow = React.memo(({ node, depth, dateGroup, isExpanded, toggleExpand, viewMode, index, measureRef }: PartidaRowProps) => {
  const hasChildren = Object.keys(node.children).length > 0 || node.metrados.length > 0;
  
  // Estilos condicionales por nivel S10
  let bgClass = 'bg-white';
  let textClass = 'text-slate-700';
  let fontClass = 'font-normal';

  if (node.partida.es_agrupador) {
    bgClass = 'bg-emerald-50 border-t-2 border-emerald-200';
    textClass = 'text-emerald-900';
    fontClass = 'font-bold';
  } else if (hasChildren) {
    bgClass = 'bg-white border-t border-emerald-100';
    textClass = 'text-emerald-900';
    fontClass = 'font-semibold';
  }

  const isDetallada = viewMode === 'Detallada';
  const isValorizada = viewMode === 'Valorizada';
  const isAgrupador = node.partida.es_agrupador;
  const precio = node.partida.precio_unitario_base || 0;
  const montoTotal = isValorizada ? node.parcialTotal * precio : 0;

  return (
    <tr key={`p-${dateGroup}-${node.partida.id}`} role="row" aria-expanded={hasChildren ? isExpanded : undefined} aria-level={depth + 1} className={`hover:bg-blue-50/50 transition-colors ${bgClass} ${textClass} ${fontClass} text-[11px]`} ref={measureRef} data-index={index}>
      {/* Checkbox / Espacio */}
      <td className="px-2 py-2 border-b border-slate-200"></td>
      
      {isDetallada && (
        <td className="px-1 py-2 border-b border-slate-200"></td>
      )}
      
      {/* Item (con sangría) */}
      <td className="px-1.5 py-2 border-b border-slate-200 truncate" style={{ paddingLeft: `${Math.max(12, depth * 20)}px` }}>
        <div className="flex items-center gap-1">
          {hasChildren ? (
            <button onClick={() => toggleExpand(node.partida.id)} className="p-0.5 hover:bg-black/10 rounded cursor-pointer">
              {isExpanded ? <ChevronDown size={14} className="opacity-70" /> : <ChevronRight size={14} className="opacity-70" />}
            </button>
          ) : <span className="w-4" />}
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{node.partida.codigo_expediente}</span>
        </div>
      </td>
      
      {/* Descripción */}
      <td className="px-1.5 py-2 border-b border-slate-200 whitespace-normal break-words leading-tight">
        {node.partida.modificacion && <span className="font-bold text-blue-600 mr-2 text-[10.5px]">[{node.partida.modificacion}]</span>}
        <span className="font-semibold text-slate-800 text-[10.5px] uppercase tracking-wide">{node.partida.descripcion}</span>
      </td>
      
      {/* Unidad */}
      <td className="px-1.5 py-2 border-b border-slate-200 text-center text-slate-500 font-medium">
        {isAgrupador ? '' : node.partida.unidad_medida}
      </td>
      
      {isDetallada && (
        <>
          <td className="px-1.5 py-2 border-b border-slate-200"></td> {/* Largo */}
          <td className="px-1.5 py-2 border-b border-slate-200"></td> {/* Ancho */}
          <td className="px-1.5 py-2 border-b border-slate-200"></td> {/* Alto */}
          <td className="px-1.5 py-2 border-b border-slate-200"></td> {/* Parcial */}
          <td className="px-1.5 py-2 border-b border-slate-200"></td> {/* Autor */}
          <td className="px-1.5 py-2 border-b border-slate-200"></td> {/* N Veces */}
        </>
      )}
      
      {/* Parcial Totalizado Bottom-Up */}
      <td className="px-1.5 py-2 border-b border-slate-200 text-right font-bold text-blue-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {node.parcialTotal > 0 ? node.parcialTotal.toFixed(2) : ''}
      </td>

      {isValorizada && (
        <>
          <td className="px-1.5 py-2 border-b border-slate-200 text-right text-slate-600 font-medium">
            {isAgrupador ? '' : `S/ ${precio.toFixed(2)}`}
          </td>
          <td className="px-1.5 py-2 border-b border-slate-200 text-right font-bold text-emerald-700" style={{ fontFamily: 'JetBrains Mono, monospace', backgroundColor: montoTotal > 0 ? '#ECFDF5' : 'transparent' }}>
            {montoTotal > 0 ? `S/ ${montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : ''}
          </td>
        </>
      )}
      
      {/* Acciones */}
      {isDetallada && <td className="px-1.5 py-2 border-b border-slate-200"></td>}
    </tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.node.parcialTotal === nextProps.node.parcialTotal &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.depth === nextProps.depth &&
    prevProps.dateGroup === nextProps.dateGroup &&
    prevProps.index === nextProps.index
  );
});

const MetradoRow = React.memo(({ 
  m, 
  depth, 
  isSelected, 
  callbacksRef,
  measureRef,
  index
}: { 
  m: MetradoRecord, 
  depth: number, 
  isSelected: boolean, 
  callbacksRef: React.MutableRefObject<any>,
  measureRef?: any,
  index?: number
}) => {
  const { canEditMetrado, canLiberarMetrados } = useAuthStore();
  return (
    <tr 
      ref={measureRef}
      data-index={index}
      role="row" 
      aria-level={depth + 2} 
      className={`transition-colors text-[10.5px] border-b border-green-100/50 ${(m.sin_plano || m.obs_motivo) ? 'bg-orange-50/80 hover:bg-orange-100 text-orange-900' : m.is_liberado ? 'bg-[#E0F2FE] hover:bg-[#BAE6FD] text-slate-800' : 'bg-emerald-50 hover:bg-emerald-100 text-slate-700'}`}
    >
      <td className="px-1 py-1 text-center">
        <div 
          className="flex items-center justify-center p-2.5 -m-1.5 cursor-pointer rounded hover:bg-black/5" 
          onClick={(e) => { e.stopPropagation(); callbacksRef.current.onToggleSelection?.(m.id); }}
        >
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => {}} // Handled by div click
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none"
            aria-label={`Seleccionar metrado del ${m.fecha_ejecucion}`}
          />
        </div>
      </td>
      <td className="px-1 py-1.5 whitespace-nowrap opacity-80 text-center" style={{ letterSpacing: '-0.5px' }}>
        {m.fecha_ejecucion ? `${m.fecha_ejecucion.split('-')[2]}/${m.fecha_ejecucion.split('-')[1]}/${m.fecha_ejecucion.split('-')[0].slice(-2)}` : ''}
      </td>
      
      <td className="px-1.5 py-1.5">
        <div className="flex items-center flex-wrap gap-1 pl-8 opacity-80">
          {m.frente_trabajo && m.frente_trabajo !== '-' && <span className="bg-slate-200 px-1.5 rounded text-[9px] font-bold text-slate-600" title="Frente de Trabajo">{m.frente_trabajo}</span>}
          {m.bloque_sector && m.bloque_sector !== '-' && <span className="bg-slate-200 px-1.5 rounded text-[9px] font-bold text-slate-600" title="Bloque/Sector">{m.bloque_sector}</span>}
          {m.nivel_piso && m.nivel_piso !== '-' && <span className="bg-slate-200 px-1.5 rounded text-[9px] font-bold text-slate-600" title="Nivel/Piso">{m.nivel_piso}</span>}
          {m.ambiente && m.ambiente !== '-' && <span className="bg-emerald-100 px-1.5 rounded text-[9px] font-bold text-emerald-700" title="Ambiente / Sistema">{m.ambiente}</span>}
          {m.plano_num && m.plano_num !== '-' && <span className="bg-emerald-100 px-1.5 rounded text-[9px] font-bold text-emerald-700" title="N° Plano">{m.plano_num}</span>}
          {m.observacion && <span className="bg-red-100 px-1.5 rounded text-[9px] font-bold text-red-700 cursor-help" title={m.observacion}>OBS</span>}
        </div>
      </td>
      <td className="px-1.5 py-1.5 pl-10 text-slate-600 italic whitespace-normal break-words leading-tight">
        {m.elemento_desc} {m.detalle_desc ? `- ${m.detalle_desc}` : ''}
      </td>
      
      <td className="px-1.5 py-1.5 text-center opacity-60">{m.unidad}</td>
      
      {/* Celdas numéricas con fuente Mono */}
      <td className="px-1.5 py-1.5 text-center opacity-90" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.cantidad_elementos || '-'}</td>
      <td className="px-1.5 py-1.5 text-right opacity-90" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.medida_largo_area || '-'}</td>
      <td className="px-1.5 py-1.5 text-right opacity-90" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.medida_ancho_empalme || '-'}</td>
      <td className="px-1.5 py-1.5 text-right opacity-90" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.medida_alto_gancho || '-'}</td>
      <td className="px-1.5 py-1.5 text-right opacity-90" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.resultado_parcial?.toFixed(2) || '-'}</td>
      
      <td className="px-1.5 py-1.5 text-center font-medium opacity-80 truncate max-w-[100px]">{m.autor_nombre?.split(' ')[0] || m.firma_ingeniero || '-'}</td>
      
      <td className="px-1.5 py-1.5 text-right opacity-90" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.nro_repeticiones || '-'}</td>
      
      <td className="px-1.5 py-1.5 text-left opacity-90 border-l border-slate-100/50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {m.resultado_total ? m.resultado_total.toFixed(2) : '-'}
      </td>
      
      <td className="px-2 py-1 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <div 
            className={`p-1.5 rounded ${m.is_liberado ? 'text-green-600' : 'text-slate-400'} ${canLiberarMetrados() ? 'cursor-pointer hover:bg-slate-100' : ''}`} 
            title={m.is_liberado ? "Aprobado" : "Pendiente"}
            onClick={(e) => {
              if (canLiberarMetrados()) {
                e.stopPropagation();
                callbacksRef.current.onToggleLiberar(m);
              }
            }}
          >
            {m.is_liberado ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            )}
          </div>
          {canEditMetrado(m.fecha_ejecucion, m.autor_nombre) && (
            <>
              <button onClick={() => callbacksRef.current.onEdit(m)} className="p-2 -m-1 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Editar" aria-label="Editar">
                <Edit2 size={14} />
              </button>
              <button onClick={() => callbacksRef.current.onDelete(m)} className="p-2 -m-1 text-red-600 hover:bg-red-100 rounded transition-colors" title="Eliminar" aria-label="Eliminar">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});


interface TreeNode {
  partida: Partida;
  children: Record<string, TreeNode>;
  sortedChildren?: TreeNode[];
  metrados: MetradoRecord[];
  parcialTotal: number;
}

export default function MetradosTreeGrid({ metrados, partidas, onEdit, onDelete, selectedIds = new Set(), onToggleSelection, onSelectAll, groupByDate = 'none', viewMode = 'Detallada' }: MetradosTreeGridProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const { toggleLiberarMetrado } = useMetradosStore();
  const { canEditMetrado, canLiberarMetrados, isLiquidaciones } = useAuthStore();

  const handleToggleLiberar = async (m: MetradoRecord) => {
    await toggleLiberarMetrado(m.id, !m.is_liberado);
  };

  const callbacksRef = useLatestCallbacks({ onEdit, onDelete, onToggleSelection, canEditMetrado, canLiberarMetrados, onToggleLiberar: handleToggleLiberar });

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const treesByDate = useMemo(() => {
    const groups: Record<string, MetradoRecord[]> = {};
    if (groupByDate === 'none') {
      groups['all'] = metrados;
    } else {
      metrados.forEach(m => {
        const d = m.fecha_ejecucion || 'Sin fecha';
        if (!groups[d]) groups[d] = [];
        groups[d].push(m);
      });
    }

    const buildTree = (mets: MetradoRecord[], partidasMap: Map<string, Partida>) => {
      const relevantPartidasIds = new Set<string>();

      mets.forEach(m => {
        let currentId = m.partida_id;
        while (currentId) {
          relevantPartidasIds.add(currentId);
          const p = partidasMap.get(currentId);
          if (p?.parent_id) {
            currentId = p.parent_id;
          } else {
            break;
          }
        }
      });

      const rootNodes: Record<string, TreeNode> = {};
      const allNodes: Record<string, TreeNode> = {};

      Array.from(relevantPartidasIds).forEach(id => {
        const p = partidasMap.get(id);
        if (p) {
          allNodes[id] = { partida: p, children: {}, metrados: [], parcialTotal: 0 };
        }
      });

      mets.forEach(m => {
        if (allNodes[m.partida_id]) {
          allNodes[m.partida_id].metrados.push(m);
        }
      });

      Object.values(allNodes).forEach(node => {
        const parentId = node.partida.parent_id;
        // Optimization: Sort metrados immediately by snapshot_codigo or fecha
        node.metrados.sort((a, b) => (a.fecha_ejecucion || '').localeCompare(b.fecha_ejecucion || ''));
        
        if (parentId && allNodes[parentId]) {
          allNodes[parentId].children[node.partida.id] = node;
        } else {
          rootNodes[node.partida.id] = node;
        }
      });

      const calculateTotals = (nodes: Record<string, TreeNode>) => {
        let sum = 0;
        Object.values(nodes).forEach(node => {
          let nodeTotal = 0;
          if (Object.keys(node.children).length > 0) nodeTotal += calculateTotals(node.children);
          
          node.sortedChildren = Object.values(node.children).sort((a, b) => 
            a.partida.codigo_expediente.localeCompare(b.partida.codigo_expediente, undefined, { numeric: true, sensitivity: 'base' })
          );

          node.metrados.forEach(m => nodeTotal += m.resultado_total || 0);
          node.parcialTotal = nodeTotal;
          sum += nodeTotal;
        });
        return sum;
      };

      calculateTotals(rootNodes);

      return Object.values(rootNodes).sort((a, b) => 
        a.partida.codigo_expediente.localeCompare(b.partida.codigo_expediente, undefined, { numeric: true, sensitivity: 'base' })
      );
    };

    const result: Record<string, TreeNode[]> = {};
    const globalPartidasMap = new Map<string, Partida>(partidas.map(p => [p.id, p]));
    
    for (const [date, mets] of Object.entries(groups)) {
      result[date] = buildTree(mets, globalPartidasMap);
    }
    return result;
  }, [metrados, partidas, groupByDate]);


  const sortedDates = Object.keys(treesByDate).sort((a, b) => {
    if (groupByDate === 'none') return 0;
    const tA = new Date(a).getTime() || 0;
    const tB = new Date(b).getTime() || 0;
    return groupByDate === 'desc' ? tB - tA : tA - tB;
  });

  const flatRows = useMemo(() => {
    const flat: any[] = [];
    sortedDates.forEach(date => {
      if (groupByDate !== 'none') {
        flat.push({ type: 'date', date });
      }
      const flattenNode = (node: TreeNode, depth: number, dateGroup: string) => {
        const isExpanded = expandedNodes[node.partida.id] ?? true;
        flat.push({ type: 'partida', node, depth, dateGroup });
        if (isExpanded) {
          const childrenArr = node.sortedChildren || [];
          childrenArr.forEach(child => flattenNode(child, depth + 1, dateGroup));
          
          if (viewMode === 'Detallada' && node.metrados.length > 0) {
            node.metrados.forEach(m => flat.push({ type: 'metrado', m, depth }));
          }
        }
      };
      treesByDate[date].forEach(node => flattenNode(node, 0, date));
    });
    return flat;
  }, [treesByDate, sortedDates, groupByDate, viewMode, expandedNodes]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // Altura estimada de cada fila
    overscan: 10,
  });

  // Removido renderNode porque ahora usamos el componente PartidaRow memoizado

  // Si no hay partidas (aún cargando o error), mostrar mensaje
  if (partidas.length === 0) {
    return <div className="p-8 text-center text-slate-500">Cargando catálogo de partidas...</div>;
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-auto relative rounded-lg border">
      <table role="treegrid" aria-label="Planilla de Metrados" className="w-full text-left border-collapse table-fixed bg-white text-[11px] min-w-[1000px]">
        <thead role="rowgroup" className="sticky top-0 z-10 bg-[#ecfdf5] shadow-sm">
          <tr role="row">
            <th className="px-2 py-2.5 w-[30px] border-b border-[#a7f3d0] text-center">
              {viewMode === 'Detallada' && (
                <input 
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) onSelectAll?.(metrados.map(m => m.id));
                    else onSelectAll?.([]);
                  }}
                  className="w-3 h-3 rounded border-[#a7f3d0] text-[#059669] focus:ring-[#10b981] cursor-pointer"
                />
              )}
            </th>
            {viewMode === 'Detallada' && <th className="px-1 py-2.5 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] w-[40px] text-center">Fecha</th>}
            <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] w-[140px]">Item</th>
            <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0]">Descripción</th>
            <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] text-center w-[40px]">Und</th>
            {viewMode === 'Detallada' && (
              <>
                <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] text-center w-[40px]">Cant.</th>
                <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] text-right w-[60px]">Largo</th>
                <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] text-right w-[60px]">Ancho</th>
                <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] text-right w-[60px]">Alto</th>
                <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] text-right w-[60px]">Parcial</th>
                <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] w-[70px] text-center">Autor</th>
                <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] text-right w-[50px]">Veces</th>
              </>
            )}
            <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] text-left w-[70px] bg-[#d1fae5]">Total Met.</th>
            {viewMode === 'Valorizada' && (
              <>
                <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] text-right w-[60px]">P. Unit</th>
                <th className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] text-right w-[80px] bg-[#a7f3d0]">Monto</th>
              </>
            )}
            {viewMode === 'Detallada' && <th role="columnheader" className="px-1.5 py-2 text-[10px] font-bold text-[#064e3b] uppercase tracking-wider border-b border-[#a7f3d0] w-[60px]">Acciones</th>}
          </tr>
        </thead>
        <tbody role="rowgroup" className="divide-y divide-gray-100 bg-white relative">
          {rowVirtualizer.getVirtualItems().length > 0 && (
            <tr><td style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} colSpan={14} /></tr>
          )}
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const rowData = flatRows[virtualRow.index];
            if (rowData.type === 'date') {
              return (
                <tr role="row" key={virtualRow.key} ref={rowVirtualizer.measureElement} data-index={virtualRow.index}>
                  <td colSpan={14} className="px-4 py-1.5 font-bold sticky left-0 z-10 shadow-sm" style={{ backgroundColor: '#BAE6FD', color: '#334155', borderTop: '2px solid #7DD3FC', borderBottom: '1px solid #7DD3FC' }}>
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 text-blue-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px', letterSpacing: '0.05em', color: '#1E293B' }}>
                        DÍA DE EJECUCIÓN: {rowData.date.split('-').reverse().join('/')}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            } else if (rowData.type === 'partida') {
              return (
                <PartidaRow
                  key={`p-${rowData.dateGroup}-${rowData.node.partida.id}`}
                  node={rowData.node}
                  depth={rowData.depth}
                  dateGroup={rowData.dateGroup}
                  isExpanded={expandedNodes[rowData.node.partida.id] ?? true}
                  toggleExpand={toggleExpand}
                  viewMode={viewMode}
                  index={virtualRow.index}
                  measureRef={virtualRow.measureElement}
                />
              );
            } else if (rowData.type === 'metrado') {
              // Extract the component creation from the old recursive function directly here
              return (
                <MetradoRow 
                  key={virtualRow.key}
                  m={rowData.m} 
                  depth={rowData.depth} 
                  isSelected={selectedIds.has(rowData.m.id)} 
                  callbacksRef={callbacksRef} 
                  measureRef={virtualRow.measureElement}
                  index={virtualRow.index}
                />
              );
            }
            return null;
          })}
          {rowVirtualizer.getVirtualItems().length > 0 && (
            <tr><td style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }} colSpan={14} /></tr>
          )}
          {metrados.length === 0 && (
            <tr>
              <td colSpan={14} className="px-4 py-12 text-center text-slate-500 bg-slate-50/50">
                <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                  <span className="text-[13px] font-medium">No se encontraron registros de metrados</span>
                  <span className="text-[11px]">Intenta ajustar los filtros de búsqueda</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
        {viewMode === 'Valorizada' && (
          <tfoot className="sticky bottom-0 z-20">
            <tr style={{ background: 'linear-gradient(180deg, #D8DCE5 0%, #C8CDD8 100%)', borderTop: '2px solid #10B981', boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
              <td colSpan={5} className="px-3 py-2.5">
                <div className="flex items-center gap-2 justify-end">
                  <span style={{ color: '#064E3B', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {isLiquidaciones() ? 'TOTAL VALORIZADO LIQUIDACIÓN' : 'TOTAL VALORIZADO ACUMULADO'}
                  </span>
                </div>
              </td>
              <td className="px-1.5 py-2.5 text-right" colSpan={2}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: '#047857', fontWeight: 800 }}>
                  S/ {Object.values(treesByDate).flat().reduce((sum, n) => sum + (n.parcialTotal * (n.partida.precio_unitario_base || 0)), 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
