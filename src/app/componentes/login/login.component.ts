import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { mensajeError } from '../../util/errores';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  correo = '';
  contrasena = '';
  cargando = signal(false);
  error = signal('');

  enviar() {
    this.error.set('');
    if (!this.correo.trim() || !this.contrasena) {
      this.error.set('Escribe tu correo y contraseña.');
      return;
    }
    this.cargando.set(true);
    this.auth.login(this.correo.trim(), this.contrasena).subscribe({
      next: () => this.router.navigateByUrl(this.ruta.snapshot.queryParamMap.get('volver') || '/inicio'),
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensajeError(e));
      }
    });
  }
}
