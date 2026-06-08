// alumnos.js - Módulo de gestión de alumnos (profesor)

// REEMPLAZA por esto:
function getSupabaseClient() {
    return window.supabaseClient || (window.getSupabase ? window.getSupabase() : null);
}

function initAlumnos() {
    return getSupabaseClient();
}

// ===== OBTENER TODOS LOS ALUMNOS =====
async function obtenerAlumnos() {
    if (!supabaseClient) initAlumnos();
    
    try {
        const { data, error } = await supabaseClient
            .from('alumnos')
            .select('*')
            .order('nombre', { ascending: true });
        
        if (error) throw error;
        
        return { success: true, alumnos: data || [] };
    } catch (error) {
        console.error('Error obteniendo alumnos:', error);
        return { success: false, error: error.message, alumnos: [] };
    }
}

// ===== OBTENER ALUMNO POR ID =====
async function obtenerAlumnoPorId(id) {
    if (!supabaseClient) initAlumnos();
    
    try {
        const { data, error } = await supabaseClient
            .from('alumnos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        return { success: true, alumno: data };
    } catch (error) {
        console.error('Error obteniendo alumno:', error);
        return { success: false, error: error.message };
    }
}

// ===== CREAR NUEVO ALUMNO =====
async function crearAlumno(alumnoData) {
    if (!supabaseClient) initAlumnos();
    
    try {
        // Verificar si ya existe el email
        const { data: existente } = await supabaseClient
            .from('alumnos')
            .select('email')
            .eq('email', alumnoData.email)
            .single();
        
        if (existente) {
            return { success: false, error: 'Ya existe un alumno con ese email' };
        }
        
        const { data, error } = await supabaseClient
            .from('alumnos')
            .insert([{
                nombre: alumnoData.nombre,
                email: alumnoData.email,
                telefono: alumnoData.telefono || null,
                fecha_registro: new Date()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, alumno: data };
    } catch (error) {
        console.error('Error creando alumno:', error);
        return { success: false, error: error.message };
    }
}

// ===== ACTUALIZAR ALUMNO =====
async function actualizarAlumno(id, alumnoData) {
    if (!supabaseClient) initAlumnos();
    
    try {
        const { data, error } = await supabaseClient
            .from('alumnos')
            .update({
                nombre: alumnoData.nombre,
                email: alumnoData.email,
                telefono: alumnoData.telefono || null
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, alumno: data };
    } catch (error) {
        console.error('Error actualizando alumno:', error);
        return { success: false, error: error.message };
    }
}

// ===== ELIMINAR ALUMNO =====
async function eliminarAlumno(id) {
    if (!supabaseClient) initAlumnos();
    
    try {
        // Verificar si tiene progreso asociado
        const { data: progreso } = await supabaseClient
            .from('progreso')
            .select('id')
            .eq('alumno_id', id);
        
        if (progreso && progreso.length > 0) {
            // Eliminar progreso primero
            await supabaseClient
                .from('progreso')
                .delete()
                .eq('alumno_id', id);
        }
        
        // Eliminar alumno
        const { error } = await supabaseClient
            .from('alumnos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Error eliminando alumno:', error);
        return { success: false, error: error.message };
    }
}

// ===== EXPORTAR ALUMNOS A CSV =====
function exportarAlumnosCSV(alumnos) {
    if (!alumnos || alumnos.length === 0) {
        return null;
    }
    
    // Definir columnas
    const columnas = ['ID', 'Nombre', 'Email', 'Teléfono', 'Fecha Registro'];
    const filas = alumnos.map(alumno => [
        alumno.id,
        alumno.nombre,
        alumno.email,
        alumno.telefono || '',
        new Date(alumno.fecha_registro).toLocaleDateString('es-CL')
    ]);
    
    // Construir CSV
    const csvContent = [
        columnas.join(','),
        ...filas.map(fila => fila.map(celda => `"${celda}"`).join(','))
    ].join('\n');
    
    return csvContent;
}

// ===== DESCARGAR CSV =====
function descargarCSV(csvContent, nombreArchivo = 'alumnos.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ===== BUSCAR ALUMNOS =====
function buscarAlumnos(alumnos, termino) {
    if (!termino || termino.trim() === '') return alumnos;
    
    const terminoLower = termino.toLowerCase().trim();
    return alumnos.filter(alumno => 
        alumno.nombre.toLowerCase().includes(terminoLower) ||
        alumno.email.toLowerCase().includes(terminoLower)
    );
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.alumnos = {
        obtener: obtenerAlumnos,
        obtenerPorId: obtenerAlumnoPorId,
        crear: crearAlumno,
        actualizar: actualizarAlumno,
        eliminar: eliminarAlumno,
        exportarCSV: exportarAlumnosCSV,
        descargarCSV: descargarCSV,
        buscar: buscarAlumnos,
        init: initAlumnos
    };
}