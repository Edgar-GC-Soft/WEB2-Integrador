import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../servicios/admin.service';
import { AvisoService } from '../../servicios/aviso.service';
import { Libro, ResumenImportacion } from '../../modelos/modelos';
import { mensajeError } from '../../util/errores';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  private admin = inject(AdminService);
  private avisos = inject(AvisoService);

  // Importacion
  consulta = '';
  idioma = 'es';
  limite = 20;
  categoria = '';
  importando = signal(false);
  resumen = signal<ResumenImportacion | null>(null);

  // Listado
  buscar = '';
  libros = signal<Libro[]>([]);
  total = signal(0);
  pagina = signal(1);
  totalPaginas = signal(1);
  cargando = signal(false);

  ngOnInit() { this.cargar(1); }

  importar() {
    if (this.consulta.trim().length < 2) { this.avisos.info('Escribe qué quieres buscar (título, autor o tema).'); return; }
    this.importando.set(true);
    this.resumen.set(null);
    this.admin.importar({ consulta: this.consulta.trim(), idioma: this.idioma, limite: this.limite, categoria: this.categoria.trim() }).subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.importando.set(false);
        this.avisos.exito(`Se importaron ${r.importados} libros (quedan inactivos hasta que los actives).`);
        this.cargar(1);
      },
      error: (e) => { this.importando.set(false); this.avisos.error(mensajeError(e)); }
    });
  }

  cargar(pagina: number) {
    this.cargando.set(true);
    this.admin.listar(pagina, this.buscar.trim()).subscribe({
      next: (r) => {
        this.libros.set(r.libros);
        this.total.set(r.total);
        this.pagina.set(r.pagina);
        this.totalPaginas.set(r.totalPaginas);
        this.cargando.set(false);
      },
      error: (e) => { this.cargando.set(false); this.avisos.error(mensajeError(e)); }
    });
  }

  cambiarEstado(libro: Libro) {
    const activo = !libro.activo;
    this.admin.cambiarEstado(libro.id, activo).subscribe({
      next: () => this.libros.update((lista) => lista.map((l) => (l.id === libro.id ? { ...l, activo } : l))),
      error: (e) => this.avisos.error(mensajeError(e))
    });
  }
}
