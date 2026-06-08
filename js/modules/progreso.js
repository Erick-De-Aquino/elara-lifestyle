// progreso.js - Módulo de gestión de progreso y apuntes


function initProgreso() {
    return window.supabaseClient;
}

// ===== OBTENER PROGRESO DEL ALUMNO =====
async function obtenerProgreso(alumnoId) {
    if (!supabaseClient) initProgreso();
    
    try {
        const { data, error } = await supabaseClient
            .from('progreso')
            .select('*')
            .eq('alumno_id', alumnoId);
        
        if (error) throw error;
        
        // Crear mapa de progreso
        const progresoMap = {};
        if (data) {
            data.forEach(p => {
                progresoMap[p.clase_id] = p.completada;
            });
        }
        
        return { success: true, progreso: progresoMap, data };
    } catch (error) {
        console.error('Error obteniendo progreso:', error);
        return { success: false, error: error.message, progreso: {} };
    }
}

// ===== MARCAR CLASE COMO COMPLETADA =====
async function marcarClaseCompletada(alumnoId, claseId) {
    if (!supabaseClient) initProgreso();
    
    try {
        // Verificar si ya existe
        const { data: existente } = await supabaseClient
            .from('progreso')
            .select('id')
            .eq('alumno_id', alumnoId)
            .eq('clase_id', claseId)
            .single();
        
        if (existente) {
            // Actualizar
            const { error } = await supabaseClient
                .from('progreso')
                .update({ completada: true, fecha_completado: new Date() })
                .eq('id', existente.id);
            
            if (error) throw error;
        } else {
            // Crear nuevo
            const { error } = await supabaseClient
                .from('progreso')
                .insert({
                    alumno_id: alumnoId,
                    clase_id: claseId,
                    completada: true,
                    fecha_completado: new Date()
                });
            
            if (error) throw error;
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error marcando clase:', error);
        return { success: false, error: error.message };
    }
}

// ===== MARCAR CLASE COMO NO COMPLETADA =====
async function marcarClaseNoCompletada(alumnoId, claseId) {
    if (!supabaseClient) initProgreso();
    
    try {
        const { error } = await supabaseClient
            .from('progreso')
            .update({ completada: false, fecha_completado: null })
            .eq('alumno_id', alumnoId)
            .eq('clase_id', claseId);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Error desmarcando clase:', error);
        return { success: false, error: error.message };
    }
}

// ===== GUARDAR APUNTES =====
async function guardarApuntes(alumnoId, claseId, contenido) {
    if (!supabaseClient) initProgreso();
    
    try {
        // Verificar si ya existe apunte
        const { data: existente } = await supabaseClient
            .from('apuntes')
            .select('id')
            .eq('alumno_id', alumnoId)
            .eq('clase_id', claseId)
            .single();
        
        if (existente) {
            const { error } = await supabaseClient
                .from('apuntes')
                .update({ contenido, fecha_actualizacion: new Date() })
                .eq('id', existente.id);
            
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('apuntes')
                .insert({
                    alumno_id: alumnoId,
                    clase_id: claseId,
                    contenido,
                    fecha_creacion: new Date()
                });
            
            if (error) throw error;
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error guardando apuntes:', error);
        return { success: false, error: error.message };
    }
}

// ===== OBTENER APUNTES =====
async function obtenerApuntes(alumnoId, claseId) {
    if (!supabaseClient) initProgreso();
    
    try {
        const { data, error } = await supabaseClient
            .from('apuntes')
            .select('contenido')
            .eq('alumno_id', alumnoId)
            .eq('clase_id', claseId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        return { success: true, contenido: data?.contenido || '' };
    } catch (error) {
        console.error('Error obteniendo apuntes:', error);
        return { success: false, contenido: '', error: error.message };
    }
}

// ===== CALCULAR PROGRESO TOTAL =====
function calcularProgresoTotal(clases, progreso) {
    if (!clases || clases.length === 0) return 0;
    
    const totalClases = clases.length;
    const completadas = clases.filter(clase => progreso[clase.id]).length;
    
    return Math.round((completadas / totalClases) * 100);
}

// ===== OBTENER PRÓXIMA CLASE =====
function obtenerProximaClase(clases, progreso) {
    const noCompletadas = clases.filter(clase => !progreso[clase.id]);
    return noCompletadas[0] || null;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.progreso = {
        obtener: obtenerProgreso,
        marcarCompletada: marcarClaseCompletada,
        marcarNoCompletada: marcarClaseNoCompletada,
        guardarApuntes: guardarApuntes,
        obtenerApuntes: obtenerApuntes,
        calcularTotal: calcularProgresoTotal,
        obtenerProximaClase: obtenerProximaClase,
        init: initProgreso
    };
}