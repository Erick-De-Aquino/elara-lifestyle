// login.js - Lógica de la página de login

// ===== INICIALIZAR =====
async function initLogin() {
    // Verificar si ya hay sesión activa
    const sesion = window.auth?.getCurrentUser();
    if (sesion) {
        const basePath = window.utils?.getBasePath() || './';
        if (sesion.rol === 'alumno') {
            window.location.href = basePath + 'pages/alumno/curso.html';
        } else if (sesion.rol === 'profesor') {
            window.location.href = basePath + 'pages/profesor/dashboard.html';
        }
        return;
    }
    
    // Inicializar el formulario
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
    
    // Botón de recuperar contraseña
    const btnRecuperar = document.getElementById('btnOlvideContrasenna');
    if (btnRecuperar) {
        btnRecuperar.addEventListener('click', handleRecuperarContrasenna);
    }
}

// ===== MANEJAR LOGIN =====
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        window.modal?.mostrar('Completa todos los campos', 'warning');
        return;
    }
    
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitBtn?.textContent || 'Iniciar Sesión';
    if (submitBtn) {
        submitBtn.textContent = 'Cargando...';
        submitBtn.disabled = true;
    }
    
    await window.auth?.login(email, password);
    
    if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ===== MANEJAR RECUPERAR CONTRASEÑA =====
async function handleRecuperarContrasenna(e) {
    e.preventDefault();
    
    const email = prompt('Ingresa tu correo electrónico para recibir un enlace de recuperación:');
    if (!email) return;
    
    await window.auth?.recuperarContrasenna(email);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initLogin);