// reset-password.js - Página para restablecer contraseña

async function initResetPassword() {
    const supabase = window.supabaseClient;
    if (!supabase) {
        window.modal?.mostrar('Error de conexión', 'error');
        return;
    }
    
    // Obtener el token de la URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    if (!accessToken) {
        window.modal?.mostrar('Enlace inválido o expirado', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Establecer la sesión con el token
    const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
    });
    
    if (error) {
        window.modal?.mostrar('Error al verificar el enlace', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    // Inicializar los ojitos para mostrar/ocultar contraseña
    initPasswordToggles();
    
    // Manejar el formulario
    const form = document.getElementById('resetForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            window.modal?.mostrar('Las contraseñas no coinciden', 'warning');
            return;
        }
        
        if (password.length < 6) {
            window.modal?.mostrar('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }
        
        const submitBtn = form.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Actualizando...';
        
        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Actualizar Contraseña';
        
        if (updateError) {
            window.modal?.mostrar(updateError.message, 'error');
        } else {
            window.modal?.mostrar('Contraseña actualizada. Ya puedes iniciar sesión.', 'exito');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    });
}

// ===== MOSTRAR/OCULTAR CONTRASEÑA =====
function initPasswordToggles() {
    // Toggle para la contraseña nueva
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            updateSvgIcon(togglePassword, type === 'password');
        });
    }
    
    // Toggle para la confirmación de contraseña
    const toggleConfirm = document.getElementById('toggleConfirmPassword');
    const confirmInput = document.getElementById('confirmPassword');
    
    if (toggleConfirm && confirmInput) {
        toggleConfirm.addEventListener('click', () => {
            const type = confirmInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmInput.setAttribute('type', type);
            updateSvgIcon(toggleConfirm, type === 'password');
        });
    }
}

function updateSvgIcon(button, isPassword) {
    const svg = button.querySelector('svg');
    if (isPassword) {
        svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    } else {
        svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    }
}

document.addEventListener('DOMContentLoaded', initResetPassword);