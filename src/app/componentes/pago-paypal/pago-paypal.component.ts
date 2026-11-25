import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

// Carga el SDK de PayPal y dibuja el boton de suscripcion.
// custom_id = id del usuario: el backend lo usa para comprobar que la suscripcion es de esa cuenta.
@Component({
  selector: 'app-pago-paypal',
  standalone: true,
  template: `<p class="libro-autor">Cargando PayPal...</p><div #contenedor></div>`
})
export class PagoPaypalComponent implements AfterViewInit {
  @Input({ required: true }) clientId!: string;
  @Input({ required: true }) planId!: string;
  @Input({ required: true }) usuarioId!: number;
  @Output() aprobado = new EventEmitter<string>();
  @Output() fallo = new EventEmitter<string>();
  @ViewChild('contenedor', { static: true }) contenedor!: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    this.cargarSdk()
      .then(() => this.dibujar())
      .catch(() => this.fallo.emit('No se pudo cargar PayPal. Revisa tu conexión e intenta de nuevo.'));
  }

  private cargarSdk(): Promise<void> {
    const w = window as any;
    if (w.paypal) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(this.clientId)}&vault=true&intent=subscription&currency=MXN`;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  private dibujar() {
    const w = window as any;
    w.paypal
      .Buttons({
        style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'subscribe' },
        createSubscription: (_data: any, actions: any) =>
          actions.subscription.create({ plan_id: this.planId, custom_id: String(this.usuarioId) }),
        onApprove: (data: any) => this.aprobado.emit(data.subscriptionID),
        onCancel: () => this.fallo.emit('Cancelaste el pago. No se activó ninguna suscripción.'),
        onError: () => this.fallo.emit('PayPal reportó un error. Intenta de nuevo.')
      })
      .render(this.contenedor.nativeElement);
  }
}
