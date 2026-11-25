import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { AvisoService } from '../../servicios/aviso.service';
import { mensajeError } from '../../util/errores';
import { MSG_CONTRASENA, esContrasenaValida, esCorreoValido } from '../../util/validadores';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.component.html'
})
export class RegistroComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private avisos = inject(AvisoService);

  nombre = '';
  correo = '';
  contrasena = '';
  confirmar = '';
  aceptaPrivacidad = false;
  mayorEdad = false;
  cargando = signal(false);
  error = signal('');

  enviar() {
    this.error.set('');
    const problema = this.validar();
    if (problema) { this.error.set(problema); return; }

    this.cargando.set(true);
    this.auth.registrar({
      nombre: this.nombre.trim(), correo: this.correo.trim(), contrasena: this.contrasena,
      aceptaPrivacidad: this.aceptaPrivacidad, mayorEdad: this.mayorEdad
    }).subscribe({
      next: () => {
        this.avisos.exito('Cuenta creada. Ya puedes iniciar sesión.');
        this.router.navigate(['/login']);
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensajeError(e));
      }
    });
  }

  private validar(): string {
    if (this.nombre.trim().length < 2) return 'Escribe tu nombre.';
    if (!esCorreoValido(this.correo)) return 'El correo no tiene un formato válido.';
    if (!esContrasenaValida(this.contrasena)) return MSG_CONTRASENA;
    if (this.contrasena !== this.confirmar) return 'Las contraseñas no coinciden.';
    if (!this.aceptaPrivacidad) return 'Debes aceptar el aviso de privacidad y los términos.';
    if (!this.mayorEdad) return 'Debes confirmar que eres mayor de 18 años.';
    return '';
  }
}
