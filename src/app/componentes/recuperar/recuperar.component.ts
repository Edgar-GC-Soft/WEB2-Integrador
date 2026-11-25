import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { mensajeError } from '../../util/errores';
import { esCorreoValido } from '../../util/validadores';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './recuperar.component.html'
})
export class RecuperarComponent {
  private auth = inject(AuthService);
  correo = '';
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  enviar() {
    this.error.set('');
    if (!esCorreoValido(this.correo)) { this.error.set('Escribe un correo válido.'); return; }
    this.cargando.set(true);
    this.auth.recuperar(this.correo.trim()).subscribe({
      next: (r) => { this.cargando.set(false); this.mensaje.set(r.mensaje); },
      error: (e) => { this.cargando.set(false); this.error.set(mensajeError(e)); }
    });
  }
}
