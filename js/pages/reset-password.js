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

document.addEventListener('DOMContentLoaded', initResetPassword);