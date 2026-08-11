import { useState, useMemo, useCallback } from 'react';
import { useMetradosStore } from '../store/useMetradosStore';
import { usePersonalStore } from '../store/usePersonalStore';
import { useAuthStore } from '../store/useAuthStore';

import { formulaRegistry, EstandarStrategy } from '../../utils/formulas/strategies'; import type { MetradoFormValues } from '../../utils/formulas/strategies';

// ----------------------

export function useMetradosForm(editingMetradoArg?: any, lockedEspecialidad?: string | null) {
  const { addMetrado, updateMetrado, proyectos, factoresHvac, editingMetrado, setEditingMetrado, partidas } = useMetradosStore();
  const { obreros, selectedObrerosIds, setSelectedObrerosIds } = usePersonalStore();
  const { isLiquidaciones, user } = useAuthStore();
  
  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [values, setValues] = useState<MetradoFormValues>({
    proyecto_id: '',
    fecha: defaultDate,
    autor: user?.nombre_completo || '', 
    especialidad: '',
    frente: '',
    ambiente: '',
    bloque: '',
    nivel: '',
    cuadrilla: '',
    elemento: '',
    detalle: '',
    cant: 1,
    long: 0,
    ancho: 0,
    alt: 0,
    veces: 1,
    diametroAcero: '',
    hvacItemId: '',
    sinPlano: false,
    motivoSinPlano: '',
    obsSinPlano: '',
    planoCui: '',
    planoEntidad: '',
    planoBloque: '',
    planoNivel: '',
    planoEsp: '',
    planoSist: '',
    planoTipo: '',
    planoNum: '',
    observacion: ''
  });

  const [selectedPartida, setSelectedPartida] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastEditingId, setLastEditingId] = useState<string | null>(null);

  if (editingMetrado && editingMetrado.id !== lastEditingId) {
    setLastEditingId(editingMetrado.id);
    setValues(prev => ({
        ...prev,
        fecha: editingMetrado.fecha_ejecucion ?? prev.fecha,
        autor: editingMetrado.firma_ingeniero ?? prev.autor,
        especialidad: editingMetrado.especialidad ?? prev.especialidad,
        frente: editingMetrado.frente_trabajo ?? prev.frente,
        ambiente: editingMetrado.ambiente ?? prev.ambiente,
        bloque: editingMetrado.bloque_sector ?? prev.bloque,
        nivel: editingMetrado.nivel_piso ?? prev.nivel,
        cuadrilla: editingMetrado.cuadrilla ?? prev.cuadrilla,
        elemento: editingMetrado.elemento_desc ?? prev.elemento,
        detalle: editingMetrado.detalle_desc ?? prev.detalle,
        cant: editingMetrado.cantidad_elementos ?? 1,
        long: editingMetrado.medida_largo_area ?? 0,
        ancho: editingMetrado.medida_ancho_empalme ?? 0,
        alt: editingMetrado.medida_alto_gancho ?? 0,
        veces: editingMetrado.nro_repeticiones ?? 1,
        diametroAcero: editingMetrado.acero_diametro ?? '',
        hvacItemId: editingMetrado.hvac_item_id ?? '',
        sinPlano: editingMetrado.sin_plano ?? false,
        motivoSinPlano: editingMetrado.obs_motivo ?? '',
        obsSinPlano: editingMetrado.obs_detalle ?? '',
        planoSist: editingMetrado.plano_sist ?? '',
        planoNum: editingMetrado.plano_num ?? '',
        planoEsp: editingMetrado.plano_esp ?? '',
        observacion: editingMetrado.observacion ?? ''
      }));
      
      const partidaDB = partidas.find(p => p.id === editingMetrado.partida_id);
      let tipo = partidaDB?.tipo_calculo || 'Estandar';
      
      // Fallback
      if (tipo === 'Estandar') {
        if (editingMetrado.acero_diametro) tipo = 'Acero';
        else if (editingMetrado.hvac_item_id) tipo = 'HVAC';
      }
      
      setSelectedPartida({
        id: editingMetrado.partida_id,
        codigo_expediente: editingMetrado.snapshot_codigo,
        descripcion: editingMetrado.snapshot_descripcion,
        unidad_medida: editingMetrado.unidad,
        tipo_calculo: tipo
      });

      setSelectedObrerosIds(editingMetrado.obreros_ids || []);
    } else if (!editingMetrado && lastEditingId !== null) {
      setLastEditingId(null);
    }

  // Determinar estrategia genuina según el tipo_calculo dictado por el backend
  const strategy = useMemo(() => {
    if (!selectedPartida || !selectedPartida.tipo_calculo) return EstandarStrategy;
    return formulaRegistry[selectedPartida.tipo_calculo] || EstandarStrategy;
  }, [selectedPartida]);

  // Datos extra para el cálculo HVAC (factor y tipo)
  const extraData = useMemo(() => {
    // Datos extra comunes para estrategias
    const baseExtra = { isLiquidaciones: isLiquidaciones() };

    if (strategy === formulaRegistry['HVAC'] && values.hvacItemId) {
      const selectedHvac = factoresHvac.find(f => f.id === values.hvacItemId);
      if (selectedHvac) {
        return {
          ...baseExtra,
          hvacItemType: selectedHvac.label.toUpperCase(),
          hvacFactor: selectedHvac.factor
        };
      }
    }
    // Si la estrategia es HVAC pero no hay item, intentamos inferir del título de la partida (Fallback)
    if (strategy === formulaRegistry['HVAC'] && selectedPartida) {
      return {
        ...baseExtra,
        hvacItemType: selectedPartida.descripcion.toUpperCase(),
        hvacFactor: 1
      };
    }
    return baseExtra;
  }, [strategy, values.hvacItemId, factoresHvac, selectedPartida, isLiquidaciones]);

  const parcial = useMemo(() => strategy.calcularParcial(values, extraData), [strategy, values, extraData]);
  const total = useMemo(() => parcial * (values.veces || 1), [parcial, values.veces]);

  const updateValue = useCallback((field: keyof MetradoFormValues, val: any) => {
    setValues(prev => {
      const next = { ...prev, [field]: val };
      
      if (field === 'especialidad') {
        const autoSinPlano = ['OBRAS PROVISIONALES', 'PLAN DE MANEJO AMBIENTAL', 'SEGURIDAD'];
        if (autoSinPlano.includes(val)) {
          next.sinPlano = true;
          next.motivoSinPlano = 'extraviado';
        }
      }
      
      return next;
    });
    
    if (field === 'cuadrilla') {
      const personalStore = usePersonalStore.getState();
      if (!val) {
        personalStore.setSelectedObrerosIds([]);
        return;
      }
      const matchObreros = personalStore.obreros.filter(o => o.cuadrillas_asignadas?.includes(val));
      personalStore.setSelectedObrerosIds(matchObreros.map(o => o.id));
    }
  }, []);

  const limpiarCamposNum = useCallback(() => {
    setValues(prev => ({ ...prev, cant: 1, long: 0, ancho: 0, alt: 0, observacion: '' }));
  }, []);

  const procesarRegistro = async () => {
    if (!selectedPartida) throw new Error("Debes seleccionar una partida");
    if (!values.proyecto_id) throw new Error("Debes seleccionar un proyecto de contexto");
    if (!values.autor) throw new Error("Debes seleccionar el autor (Ingeniero a cargo)");
    if (total === 0 && strategy === EstandarStrategy) throw new Error("El total no puede ser 0");
    if (!values.sinPlano) {
      if (!values.planoSist || !values.planoNum) throw new Error("El código de plano (Sist. y Num.) es OBLIGATORIO.");
    } else {
      if (!values.motivoSinPlano) throw new Error("Es OBLIGATORIO seleccionar el motivo de la falta de plano.");
    }
    
    setIsSubmitting(true);
    
    const seleccionados = obreros.filter(o => selectedObrerosIds.includes(o.id));
    const nombresObrerosStr = seleccionados.map(o => {
      const fn = o.nombres_completos?.trim().split(' ')[0] || '';
      const cat = o.categoria_laboral || '';
      const c = cat.toUpperCase();
      let catAbbr = cat;
      if (c.includes('OPERARIO')) catAbbr = 'OP';
      else if (c.includes('OFICIAL') || c.includes('OFIICIAL')) catAbbr = 'OF';
      else if (c.includes('PEON') || c.includes('PEÓN')) catAbbr = 'P';
      return `${fn} (${catAbbr})`;
    }).join(' / ');

    const proyectoObj = proyectos.find(p => p.id === values.proyecto_id);

    const payload = {
      partida_id: selectedPartida.id,
      snapshot_codigo: selectedPartida.codigo_expediente,
      snapshot_descripcion: selectedPartida.descripcion,
      unidad: selectedPartida.unidad_medida,
      proyecto: proyectoObj ? proyectoObj.nombre : 'Hospital', // O fallback
      especialidad: lockedEspecialidad || values.especialidad || 'ESTRUCTURAS',
      frente_trabajo: values.frente || null,
      ambiente: values.ambiente || null,
      bloque_sector: values.bloque,
      nivel_piso: values.nivel,
      cuadrilla: values.cuadrilla,
      elemento_desc: values.elemento,
      detalle_desc: values.detalle,
      acero_diametro: values.diametroAcero || null,
      hvac_item_id: strategy === formulaRegistry['HVAC'] ? values.hvacItemId : null,
      cantidad_elementos: values.cant,
      medida_largo_area: values.long,
      medida_ancho_empalme: values.ancho,
      medida_alto_gancho: values.alt,
      resultado_parcial: parcial,
      nro_repeticiones: values.veces,
      resultado_total: total,
      fecha_ejecucion: values.fecha,
      obrero_nombre: nombresObrerosStr,
      firma_ingeniero: values.autor,
      plano_sist: values.planoSist || null,
      plano_num: values.planoNum || null,
      sin_plano: values.sinPlano || false,
      obs_motivo: values.motivoSinPlano || null,
      obs_detalle: values.obsSinPlano || null,
      plano_esp: values.planoEsp || null,
      observacion: values.observacion || null
    };

    let result;
    if (editingMetrado) {
      result = await updateMetrado(editingMetrado.id, payload, selectedObrerosIds);
    } else {
      result = await addMetrado(payload, selectedObrerosIds);
    }
    
    setIsSubmitting(false);

    if (result.success) {
      if (!values.sinPlano && values.planoSist && values.planoNum && selectedPartida) {
        localStorage.setItem(`planoSist_${selectedPartida.id}`, values.planoSist);
        localStorage.setItem(`planoNum_${selectedPartida.id}`, values.planoNum);
      }
      if (values.observacion) {
        localStorage.setItem('last_observacion', values.observacion);
      }
      
      limpiarCamposNum();
      if (editingMetrado) {
        setEditingMetrado(null);
      }
    } else {
      throw new Error(result.error);
    }
  };

  const cancelarEdicion = () => {
    setEditingMetrado(null);
    limpiarCamposNum();
  };

  const usarUltimoPlano = useCallback(() => {
    if (!selectedPartida) return;
    const lastSist = localStorage.getItem(`planoSist_${selectedPartida.id}`);
    const lastNum = localStorage.getItem(`planoNum_${selectedPartida.id}`);
    
    if (lastSist && lastNum) {
      setValues(prev => ({
        ...prev,
        sinPlano: false,
        planoSist: lastSist,
        planoNum: lastNum
      }));
    } else {
      // Optional: fallback to the global one if they haven't saved one for this partida yet?
      // Actually, better to just alert them if there isn't one.
      alert('Aún no has registrado ningún plano para esta partida.');
    }
  }, [selectedPartida]);

  return {
    values,
    updateValue,
    selectedPartida,
    setSelectedPartida,
    strategy,
    extraData,
    parcial,
    total,
    isSubmitting,
    procesarRegistro,
    cancelarEdicion,
    limpiarCamposNum,
    usarUltimoPlano
  };
}
