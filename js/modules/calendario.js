// calendario.js - Módulo de gestión de calendario

function getSupabaseClient() {
    return window.supabaseClient;
}

// ===== OBTENER EVENTOS =====
async function obtenerEventos(fechaInicio = null, fechaFin = null) {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, eventos: [] };
    
    try {
        let query = supabase.from('eventos').select('*').order('fecha', { ascending: true });
        
        if (fechaInicio) query = query.gte('fecha', fechaInicio);
        if (fechaFin) query = query.lte('fecha', fechaFin);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return { success: true, eventos: data || [] };
    } catch (error) {
        console.error('Error obteniendo eventos:', error);
        return { success: false, eventos: [] };
    }
}

// ===== OBTENER EVENTOS POR MES =====
async function obtenerEventosPorMes(año, mes) {
    const fechaInicio = `${año}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(año, mes, 0).getDate();
    const fechaFin = `${año}-${String(mes).padStart(2, '0')}-${ultimoDia}`;
    return await obtenerEventos(fechaInicio, fechaFin);
}

// ===== CREAR EVENTO =====
async function crearEvento(eventoData) {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'No hay cliente' };
    
    try {
        const { data, error } = await supabase
            .from('eventos')
            .insert([{
                titulo: eventoData.titulo,
                fecha: eventoData.fecha,
                hora: eventoData.hora || null,
                usuario_id: eventoData.usuario_id || null,
                descripcion: eventoData.descripcion || null
            }])
            .select();
        
        if (error) throw error;
        return { success: true, evento: data?.[0] };
    } catch (error) {
        console.error('Error creando evento:', error);
        return { success: false, error: error.message };
    }
}

// ===== ACTUALIZAR EVENTO =====
async function actualizarEvento(id, eventoData) {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'No hay cliente' };
    
    try {
        const { error } = await supabase
            .from('eventos')
            .update({
                titulo: eventoData.titulo,
                fecha: eventoData.fecha,
                hora: eventoData.hora || null,
                descripcion: eventoData.descripcion || null
            })
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error actualizando evento:', error);
        return { success: false, error: error.message };
    }
}

// ===== ELIMINAR EVENTO =====
async function eliminarEvento(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'No hay cliente' };
    
    try {
        const { error } = await supabase.from('eventos').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error eliminando evento:', error);
        return { success: false, error: error.message };
    }
}

// ===== GENERAR CALENDARIO =====
function generarCalendario(año, mes, eventos = []) {
    const primerDia = new Date(año, mes - 1, 1);
    const ultimoDia = new Date(año, mes, 0);
    const diasEnMes = ultimoDia.getDate();
    let diaInicioSemana = primerDia.getDay();
    diaInicioSemana = diaInicioSemana === 0 ? 6 : diaInicioSemana - 1;
    
    const dias = [];
    
    // Días del mes anterior
    const fechaAnterior = new Date(año, mes - 1, 0);
    const diasAnterior = fechaAnterior.getDate();
    for (let i = diaInicioSemana - 1; i >= 0; i--) {
        const fecha = new Date(año, mes - 2, diasAnterior - i);
        const añoFecha = fecha.getFullYear();
        const mesFecha = fecha.getMonth() + 1;
        const diaFecha = fecha.getDate();
        const fechaStr = `${añoFecha}-${String(mesFecha).padStart(2, '0')}-${String(diaFecha).padStart(2, '0')}`;
        dias.push({ fecha, fechaStr, esMesActual: false, eventos: [] });
    }
    
    // Días del mes actual
    for (let i = 1; i <= diasEnMes; i++) {
        const fecha = new Date(año, mes - 1, i);
        const fechaStr = `${año}-${String(mes).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const eventosDia = eventos.filter(e => e.fecha === fechaStr);
        dias.push({ fecha, fechaStr, numero: i, esMesActual: true, eventos: eventosDia });
    }
    
    // Días del mes siguiente
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
        const fecha = new Date(año, mes, i);
        const añoFecha = fecha.getFullYear();
        const mesFecha = fecha.getMonth() + 1;
        const diaFecha = fecha.getDate();
        const fechaStr = `${añoFecha}-${String(mesFecha).padStart(2, '0')}-${String(diaFecha).padStart(2, '0')}`;
        dias.push({ fecha, fechaStr, esMesActual: false, eventos: [] });
    }
    
    return dias;
}

// ===== UTILIDADES =====
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatearFechaEvento(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

// Exportar
if (typeof window !== 'undefined') {
    window.calendario = {
        obtener: obtenerEventos,
        obtenerPorMes: obtenerEventosPorMes,
        crear: crearEvento,
        actualizar: actualizarEvento,
        eliminar: eliminarEvento,
        generar: generarCalendario,
        formatearFecha: formatearFechaEvento,
        DIAS: DIAS_SEMANA,
        MESES: MESES
    };
}