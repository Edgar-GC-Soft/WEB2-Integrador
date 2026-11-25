import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { AvisoService } from '../../servicios/aviso.service';
import { mensajeError } from '../../util/errores';
import { MSG_CONTRASENA, esContrasenaValida } from '../../util/validadores';

@Component({
  selector: 'app-restablecer',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './restablecer.component.html'
})
export class RestablecerComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private avisos = inject(AvisoService);
  private token = inject(ActivatedRoute).snapshot.paramMap.get('token') || '';

  nueva = '';
  confirmar = '';
  cargando = signal(false);
  error = signal('');

  enviar() {
    this.error.set('');
    if (!esContrasenaValida(this.nueva)) { this.error.set(MSG_CONTRASENA); return; }
    if (this.nueva !== this.confirmar) { this.error.set('Las contraseñas no coinciden.'); return; }
    this.cargando.set(true);
    this.auth.restablecer(this.token, this.nueva).subscribe({
      next: (r) => { this.avisos.exito(r.mensaje); this.router.navigate(['/login']); },
      error: (e) => { this.cargando.set(false); this.error.set(mensajeError(e)); }
    });
  }
}
