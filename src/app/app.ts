import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './servicios/auth.service';
import { NavBarComponent } from './componentes/nav-bar/nav-bar.component';
import { PieComponent } from './componentes/pie/pie.component';
import { AvisosComponent } from './componentes/avisos/avisos.component';

// Rutas que se muestran sin la barra de navegacion
const RUTAS_SIN_NAV = ['/login', '/registro'];
const conNav = (url: string) => !RUTAS_SIN_NAV.includes(url.split(/[?#]/)[0]);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent, PieComponent, AvisosComponent],
  templateUrl: './app.html'
})
export class App {
  private router = inject(Router);

  // El valor inicial sale de la URL actual para que la barra no aparezca/desaparezca al cargar la pagina
  readonly mostrarNav = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => conNav(e.urlAfterRedirects))
    ),
    { initialValue: conNav(inject(Location).path()) }
  );

  constructor() {
    // Si ya habia una sesion guardada, se carga el perfil (rol y plan) al abrir la pagina
    const auth = inject(AuthService);
    if (auth.estaLogueado()) auth.cargarPerfil().subscribe({ error: () => {} });
  }
}
