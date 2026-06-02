// ===== LOGIN PARA ALUMNOS =====

document.addEventListener('DOMContentLoaded', () => {
    const codigoInput = document.getElementById('codigoInput');
    const loginBtn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMsg');
    
    async function realizarLogin() {
        const codigo = codigoInput.value.trim();
        
        if (!codigo) {
            errorMsg.textContent = 'Introduce tu código de acceso';
            return;
        }
        
        errorMsg.textContent = 'Verificando...';
        
        const { data, error } = await supabaseClient
            .from('alumnos')
            .select('codigo, nombre')
            .eq('codigo', codigo);
        
        if (error) {
            errorMsg.textContent = 'Error de conexión';
            return;
        }
        
        if (!data || data.length === 0) {
            errorMsg.textContent = 'Código incorrecto';
            return;
        }
        
        localStorage.setItem('alumno_codigo', codigo);
        localStorage.setItem('alumno_nombre', data[0].nombre || codigo);
        
        window.location.href = 'curso.html';
    }
    
    loginBtn.addEventListener('click', realizarLogin);
    codigoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') realizarLogin();
    });
});