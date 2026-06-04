// ===== CONFIGURACIÓN DE SUPABASE =====
const SUPABASE_URL = 'https://iujoivibrqlelukocszd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1am9pdmlicnFsZWx1a29jc3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzc2OTAsImV4cCI6MjA5NTgxMzY5MH0.7Dujcn5nyi4n1iBu93oQCfeCNoDTXGWqfoebHR0hriI';

// Crear cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

