import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './servicios/auth.service';
import { NavBarComponent } from './componentes/nav-bar/nav-bar.component';
import { PieComponent } from './componentes/pie/pie.component';
import { AvisosComponent } from './componentes/avisos/avisos.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent, PieComponent, AvisosComponent],
  templateUrl: './app.html'
})
export class App {
  constructor() {
    // Si ya habia una sesion guardada, se carga el perfil (rol y plan) al abrir la pagina
    const auth = inject(AuthService);
    if (auth.estaLogueado()) auth.cargarPerfil().subscribe({ error: () => {} });
  }
}
