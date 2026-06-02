// ===== LOGIN UNIVERSAL (solo login - alumnos creados por el profesor) =====

function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    return crypto.subtle.digest('SHA-256', data).then(hash => {
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const loginUsuario = document.getElementById('loginUsuario');
    const loginPassword = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMsg');
    
    async function realizarLogin() {
        const usuario = loginUsuario.value.trim();
        const password = loginPassword.value;
        
        if (!usuario || !password) {
            errorMsg.textContent = 'Completa todos los campos';
            return;
        }
        
        errorMsg.textContent = 'Verificando...';
        
        try {
            // Buscar usuario en Supabase
            const { data, error } = await supabaseClient
                .from('alumnos')
                .select('usuario, nombre, contrasena, es_profesor')
                .eq('usuario', usuario);
            
            if (error) throw error;
            
            if (!data || data.length === 0) {
                errorMsg.textContent = 'Usuario no encontrado';
                return;
            }
            
            const persona = data[0];
            const passwordHash = await hashPassword(password);
            
            if (persona.contrasena !== passwordHash) {
                errorMsg.textContent = 'Contraseña incorrecta';
                return;
            }
            
            // Redirigir según el tipo
            if (persona.es_profesor) {
                localStorage.setItem('acceso_tipo', 'profesor');
                localStorage.setItem('usuario', usuario);
                window.location.href = 'profesor.html';
            } else {
                localStorage.setItem('alumno_usuario', usuario);
                localStorage.setItem('alumno_nombre', persona.nombre || usuario);
                localStorage.setItem('acceso_tipo', 'alumno');
                window.location.href = 'alumno/curso.html';
            }
            
        } catch (err) {
            console.error(err);
            errorMsg.textContent = 'Error de conexión';
        }
    }
    
    loginBtn.addEventListener('click', realizarLogin);
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') realizarLogin();
    });

    // Mostrar/ocultar contraseña
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
});