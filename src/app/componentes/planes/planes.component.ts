import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { AvisoService } from '../../servicios/aviso.service';
import { SuscripcionService } from '../../servicios/suscripcion.service';
import { InfoPlanes } from '../../modelos/modelos';
import { mensajeError } from '../../util/errores';
import { PagoPaypalComponent } from '../pago-paypal/pago-paypal.component';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [RouterLink, DatePipe, PagoPaypalComponent],
  templateUrl: './planes.component.html'
})
export class PlanesComponent implements OnInit {
  auth = inject(AuthService);
  private suscripcion = inject(SuscripcionService);
  private avisos = inject(AvisoService);

  info = signal<InfoPlanes | null>(null);
  procesando = signal(false);
  errorPago = signal('');

  ngOnInit() {
    this.suscripcion.planes().subscribe({
      next: (i) => this.info.set(i),
      error: (e) => this.errorPago.set(mensajeError(e))
    });
  }

  alAprobar(suscripcionId: string) {
    this.procesando.set(true);
    this.errorPago.set('');
    this.suscripcion.confirmar(suscripcionId).subscribe({
      next: (plan) => {
        this.auth.plan.set(plan);
        this.procesando.set(false);
        this.avisos.exito(plan.esSuscriptor ? '¡Suscripción activada!' : 'Pago recibido. Tu suscripción se activará en unos instantes.');
      },
      error: (e) => { this.procesando.set(false); this.errorPago.set(mensajeError(e)); }
    });
  }

  actualizarEstado() { this.auth.cargarPerfil().subscribe({ error: (e) => this.avisos.error(mensajeError(e)) }); }
}
