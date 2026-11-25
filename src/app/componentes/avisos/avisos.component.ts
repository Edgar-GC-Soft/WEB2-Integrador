import { Component, inject } from '@angular/core';
import { AvisoService } from '../../servicios/aviso.service';

@Component({
  selector: 'app-avisos',
  standalone: true,
  templateUrl: './avisos.component.html'
})
export class AvisosComponent {
  servicio = inject(AvisoService);
}
