import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private suscripcion = inject(SuscripcionService);
  private avisos = inject(AvisoService);

  info = signal<InfoPlanes | null>(null);
  procesando = signal(false);
  errorPago = signal('');

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('paypal') === 'cancel') {
      this.errorPago.set('Cancelaste el pago. No se realizó ningún cobro.');
    }
    this.suscripcion.planes().subscribe({
      next: (i) => this.info.set(i),
      error: (e) => this.errorPago.set(mensajeError(e))
    });
  }

  iniciarPago() {
    this.procesando.set(true);
    this.errorPago.set('');
    this.suscripcion.crearOrden().subscribe({
      next: (orden) => window.location.assign(orden.urlPago),
      error: (e) => { this.procesando.set(false); this.errorPago.set(mensajeError(e)); }
    });
  }

  actualizarEstado() { this.auth.cargarPerfil().subscribe({ error: (e) => this.avisos.error(mensajeError(e)) }); }
}
