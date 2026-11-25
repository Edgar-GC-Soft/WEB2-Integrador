import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { AvisoService } from '../../servicios/aviso.service';
import { BibliotecaService } from '../../servicios/biblioteca.service';
import { Coleccion } from '../../modelos/modelos';
import { mensajeError } from '../../util/errores';

@Component({
  selector: 'app-colecciones',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './colecciones.component.html'
})
export class ColeccionesComponent implements OnInit {
  auth = inject(AuthService);
  private biblioteca = inject(BibliotecaService);
  private avisos = inject(AvisoService);

  colecciones = signal<Coleccion[]>([]);
  cargando = signal(true);
  nuevoNombre = '';
  editandoId = signal<number | null>(null);
  nombreEditado = '';

  ngOnInit() { this.cargar(); }

  cargar() {
    this.biblioteca.colecciones().subscribe({
      next: (c) => { this.colecciones.set(c); this.cargando.set(false); },
      error: (e) => { this.avisos.error(mensajeError(e)); this.cargando.set(false); }
    });
  }

  crear() {
    if (!this.nuevoNombre.trim()) { this.avisos.info('Escribe un nombre para la colección.'); return; }
    this.biblioteca.crearColeccion(this.nuevoNombre.trim()).subscribe({
      next: () => { this.nuevoNombre = ''; this.avisos.exito('Colección creada'); this.cargar(); },
      error: (e) => this.avisos.error(mensajeError(e)) // aqui llega el aviso del limite del plan gratuito
    });
  }

  empezarEdicion(c: Coleccion) { this.editandoId.set(c.id); this.nombreEditado = c.nombre; }

  guardarNombre(c: Coleccion) {
    if (!this.nombreEditado.trim()) return;
    this.biblioteca.renombrarColeccion(c.id, this.nombreEditado.trim()).subscribe({
      next: () => { this.editandoId.set(null); this.cargar(); },
      error: (e) => this.avisos.error(mensajeError(e))
    });
  }

  eliminar(c: Coleccion) {
    if (!confirm(`¿Eliminar la colección "${c.nombre}"? Los libros no se borran del catálogo.`)) return;
    this.biblioteca.eliminarColeccion(c.id).subscribe({
      next: () => { this.avisos.exito('Colección eliminada'); this.cargar(); },
      error: (e) => this.avisos.error(mensajeError(e))
    });
  }
}
