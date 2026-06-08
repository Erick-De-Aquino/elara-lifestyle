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
    
    // Mostrar/ocultar contraseña
    initPasswordToggle();
}

// ===== MOSTRAR/OCULTAR CONTRASEÑA =====
function initPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (!togglePassword || !passwordInput) return;
    
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Cambiar el SVG (ojo abierto/cerrado)
        const svg = togglePassword.querySelector('svg');
        if (type === 'password') {
            svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        } else {
            svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
        }
    });
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