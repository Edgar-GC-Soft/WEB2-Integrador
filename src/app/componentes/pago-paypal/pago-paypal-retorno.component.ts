import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { SuscripcionService } from '../../servicios/suscripcion.service';
import { mensajeError } from '../../util/errores';

@Component({
  selector: 'app-pago-paypal-retorno',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Confirmación de pago</h1>
    @if (procesando()) {
      <p>Verificando el pago con PayPal...</p>
    } @else if (error()) {
      <p class="error">{{ error() }}</p>
      <a class="btn" routerLink="/planes">Volver a planes</a>
    } @else {
      <p class="ok">¡Pago confirmado! Tienes acceso a BookFlix durante un mes.</p>
      <a class="btn" routerLink="/inicio">Ir a BookFlix</a>
    }
  `
})
export class PagoPaypalRetornoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private suscripcion = inject(SuscripcionService);

  procesando = signal(true);
  error = signal('');

  ngOnInit() {
    const orderId = this.route.snapshot.queryParamMap.get('token');
    if (!orderId) {
      this.error.set('PayPal no devolvió el identificador de la orden.');
      this.procesando.set(false);
      return;
    }
    this.suscripcion.capturarOrden(orderId).subscribe({
      next: (plan) => {
        this.auth.plan.set(plan);
        this.procesando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.procesando.set(false);
      }
    });
  }
}
