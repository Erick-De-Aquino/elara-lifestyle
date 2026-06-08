// auth.js - Módulo de autenticación

// ===== INICIALIZAR SUPABASE (usar el cliente global) =====
function getSupabaseClient() {
    // Usar el cliente creado por config.js
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    if (window.getSupabase) {
        return window.getSupabase();
    }
    return null;
}


// ===== VERIFICAR ROL DEL USUARIO (nueva versión) =====
async function verificarRolUsuario(email, supabaseClient) {
    try {
        // Usar maybeSingle() en lugar de single() para evitar error si no existe
        const { data: usuario, error } = await supabaseClient
            .from('usuarios')
            .select('id, nombre, email, rol')
            .eq('email', email)
            .maybeSingle();  // <- Cambiado de .single() a .maybeSingle()
        
        if (error) {
            console.error('Error buscando usuario:', error);
            return { rol: null, usuario: null };
        }
        
        if (usuario) {
            console.log('✅ Usuario encontrado:', usuario);
            return { rol: usuario.rol, usuario: usuario };
        }
        
        console.log('❌ Usuario no encontrado en tabla usuarios:', email);
        return { rol: null, usuario: null };
    } catch (error) {
        console.error('Error verificando rol:', error);
        return { rol: null, usuario: null };
    }
}

// ===== INICIAR SESIÓN =====
async function login(email, password) {
    const supabaseClient = getSupabaseClient();
    
    if (!supabaseClient) {
        window.modal?.mostrar('Error de conexión con Supabase', 'error');
        return { success: false, error: 'Supabase no inicializado' };
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        if (data.user) {
            const { rol, usuario } = await verificarRolUsuario(email, supabaseClient);
            
            if (!rol) {
                await supabaseClient.auth.signOut();
                window.modal?.mostrar('Usuario no registrado como alumno o profesor', 'error');
                return { success: false, error: 'Rol no encontrado' };
            }
            
            const sesion = {
                user_id: data.user.id,
                email: email,
                rol: rol,
                nombre: usuario.nombre,
                id: usuario.id
            };
            
            localStorage.setItem('elara_sesion', JSON.stringify(sesion));
            localStorage.setItem('elara_acceso_tipo', rol);
            
            if (rol === 'alumno') {
                localStorage.setItem('elara_alumno_actual', JSON.stringify(usuario));
            }
            
            window.modal?.mostrar(`Bienvenido ${usuario.nombre}`, 'exito', 1500);
            
            setTimeout(() => {
                const basePath = window.utils?.getBasePath() || './';
                if (rol === 'alumno') {
                    window.location.href = basePath + 'pages/alumno/curso.html';
                } else {
                    window.location.href = basePath + 'pages/profesor/dashboard.html';
                }
            }, 1500);
            
            return { success: true, rol, usuario };
        }
        
        return { success: false, error: 'Credenciales inválidas' };
        
    } catch (error) {
        console.error('Login error:', error);
        let mensaje = 'Error al iniciar sesión';
        if (error.message === 'Invalid login credentials') {
            mensaje = 'Correo o contraseña incorrectos';
        }
        window.modal?.mostrar(mensaje, 'error');
        return { success: false, error: error.message };
    }
}

// ===== CERRAR SESIÓN =====
// ===== CERRAR SESIÓN =====
async function logout() {
    const supabaseClient = getSupabaseClient();
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    
    localStorage.removeItem('elara_sesion');
    localStorage.removeItem('elara_acceso_tipo');
    localStorage.removeItem('elara_alumno_actual');
    
    // Redirigir siempre a la raíz
    window.location.href = '/index.html';
}

// ===== OBTENER USUARIO ACTUAL =====
function getCurrentUser() {
    try {
        const sesion = localStorage.getItem('elara_sesion');
        if (sesion) {
            return JSON.parse(sesion);
        }
    } catch (e) {
        console.error('Error obteniendo usuario:', e);
    }
    return null;
}

// ===== VERIFICAR SI ESTÁ AUTENTICADO =====
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// ===== VERIFICAR ROL ACTUAL =====
function getCurrentRol() {
    const user = getCurrentUser();
    return user ? user.rol : null;
}

// ===== PROTEGER RUTA =====
function requireAuth(rolRequerido = null) {
    if (!isAuthenticated()) {
        const basePath = window.utils?.getBasePath() || './';
        window.location.href = basePath + 'index.html';
        return false;
    }
    
    if (rolRequerido && getCurrentRol() !== rolRequerido) {
        const basePath = window.utils?.getBasePath() || './';
        window.modal?.mostrar('No tienes permiso para acceder a esta página', 'error');
        window.location.href = basePath + 'index.html';
        return false;
    }
    
    return true;
}

// ===== INICIALIZAR EVENTOS DEL LOGIN =====
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            window.modal?.mostrar('Completa todos los campos', 'warning');
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Cargando...';
        submitBtn.disabled = true;
        
        await login(email, password);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// ===== RECUPERAR CONTRASEÑA =====
async function recuperarContrasenna(email) {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
        window.modal.mostrar('Error de conexión con Supabase', 'error');
        return false;
    }
    
    // URL dinámica según el entorno
    const redirectUrl = window.location.origin + '/reset-password.html';
    
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
    });
    
    if (error) {
        window.modal.mostrar(error.message, 'error');
        return false;
    } else {
        window.modal.mostrar('Te hemos enviado un enlace de recuperación a tu correo', 'exito');
        return true;
    }
}

// Inicializar
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initLoginForm();
    });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.auth = {
        login,
        logout,
        getCurrentUser,
        isAuthenticated,
        getCurrentRol,
        requireAuth,
        recuperarContrasenna
    };
}