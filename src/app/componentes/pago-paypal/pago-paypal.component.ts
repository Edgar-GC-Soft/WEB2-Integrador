import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-pago-paypal',
  standalone: true,
  template: `<button class="btn" type="button" (click)="continuar.emit()">Pagar con PayPal</button>`
})
export class PagoPaypalComponent {
  @Output() continuar = new EventEmitter<void>();
}
