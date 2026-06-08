// config.js - Configuración de Supabase (VERSIÓN DE DIAGNÓSTICO)

const SUPABASE_URL = 'https://iujoivibrqlelukocszd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1am9pdmlicnFsZWx1a29jc3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzc2OTAsImV4cCI6MjA5NTgxMzY5MH0.7Dujcn5nyi4n1iBu93oQCfeCNoDTXGWqfoebHR0hriI';

console.log('1. Config.js cargado');
console.log('2. URL:', SUPABASE_URL);
console.log('3. typeof supabase:', typeof supabase);
console.log('4. typeof window.supabase:', typeof window.supabase);
console.log('5. typeof supabaseJs:', typeof supabaseJs);

// Intentar crear cliente de diferentes formas
let supabaseClient = null;

// Forma 1: variable global supabase
if (typeof supabase !== 'undefined' && supabase.createClient) {
    console.log('Usando variable supabase');
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
// Forma 2: window.supabase
else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    console.log('Usando window.supabase');
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
// Forma 3: supabaseJs
else if (typeof supabaseJs !== 'undefined' && supabaseJs.createClient) {
    console.log('Usando supabaseJs');
    supabaseClient = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
else {
    console.error('❌ No se encontró la librería Supabase en ninguna forma');
    console.log('Variables disponibles en window:', Object.keys(window));
}

if (supabaseClient) {
    console.log('✅ Cliente Supabase creado exitosamente');
} else {
    console.log('❌ Falló la creación del cliente');
}

// Exportar
window.supabaseClient = supabaseClient;
window.getSupabase = () => supabaseClient;
window.initSupabase = () => supabaseClient;

console.log('6. Config.js terminado');