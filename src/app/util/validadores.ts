export const esCorreoValido = (c: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((c || '').trim());

// Minimo 8 caracteres, con letras y numeros
export const esContrasenaValida = (p: string) => !!p && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

export const MSG_CONTRASENA = 'La contraseña debe tener al menos 8 caracteres, con letras y números.';
