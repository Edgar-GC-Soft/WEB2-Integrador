import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { AvisoService } from '../../servicios/aviso.service';
import { SuscripcionService } from '../../servicios/suscripcion.service';
import { UsuarioService } from '../../servicios/usuario.service';
import { mensajeError } from '../../util/errores';
import { MSG_CONTRASENA, esContrasenaValida } from '../../util/validadores';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent {
  auth = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private suscripcion = inject(SuscripcionService);
  private avisos = inject(AvisoService);

  nombre = this.auth.usuario()?.nombre || '';
  contrasenaActual = '';
  contrasenaNueva = '';
  tipoArco = '';
  descripcionArco = '';
  errorContrasena = signal('');
  cancelando = signal(false);

  textoPlan = computed(() => {
    const p = this.auth.plan();
    if (!p) return '';
    switch (p.estado) {
      case 'activa': return 'Acceso mensual activo';
      case 'cancelada': return p.esSuscriptor ? 'Suscripción cancelada (conservas los beneficios hasta el fin del periodo)' : 'Plan gratuito (suscripción cancelada)';
      case 'pago_fallido': return p.esSuscriptor ? 'Pago fallido (conservas los beneficios hasta el fin del periodo)' : 'Plan gratuito (el último pago falló)';
      case 'pendiente': return 'Pago pendiente de confirmación';
      case 'expirada': return p.esSuscriptor ? 'Suscripción vencida' : 'Plan gratuito (suscripción vencida)';
      default: return 'Plan gratuito';
    }
  });

  guardarNombre() {
    if (this.nombre.trim().length < 2) { this.avisos.info('Escribe un nombre válido.'); return; }
    this.usuarioService.actualizarNombre(this.nombre.trim()).subscribe({
      next: () => { this.avisos.exito('Perfil actualizado'); this.auth.cargarPerfil().subscribe({ error: () => {} }); },
      error: (e) => this.avisos.error(mensajeError(e))
    });
  }

  cambiarContrasena() {
    this.errorContrasena.set('');
    if (!this.contrasenaActual) { this.errorContrasena.set('Escribe tu contraseña actual.'); return; }
    if (!esContrasenaValida(this.contrasenaNueva)) { this.errorContrasena.set(MSG_CONTRASENA); return; }
    this.usuarioService.cambiarContrasena(this.contrasenaActual, this.contrasenaNueva).subscribe({
      next: () => { this.contrasenaActual = ''; this.contrasenaNueva = ''; this.avisos.exito('Contraseña actualizada'); },
      error: (e) => this.errorContrasena.set(mensajeError(e))
    });
  }

  cancelarSuscripcion() {
    if (!confirm('¿Cancelar tu suscripción? Conservarás los beneficios hasta el final del periodo ya pagado.')) return;
    this.cancelando.set(true);
    this.suscripcion.cancelar().subscribe({
      next: (plan) => {
        this.auth.plan.set(plan);
        this.cancelando.set(false);
        this.avisos.exito('Suscripción cancelada');
      },
      error: (e) => { this.cancelando.set(false); this.avisos.error(mensajeError(e)); }
    });
  }

  enviarArco() {
    if (!this.tipoArco) { this.avisos.info('Elige el tipo de solicitud.'); return; }
    this.usuarioService.solicitudArco(this.tipoArco, this.descripcionArco.trim()).subscribe({
      next: (r) => { this.tipoArco = ''; this.descripcionArco = ''; this.avisos.exito(r.mensaje); },
      error: (e) => this.avisos.error(mensajeError(e))
    });
  }
}
