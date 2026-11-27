import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { AvisoService } from '../../servicios/aviso.service';
import { LectorService } from '../../servicios/lector.service';
import { Fragmento, PreferenciasLector } from '../../modelos/modelos';
import { mensajeError } from '../../util/errores';

const FUENTES: Record<string, string> = {
  serif: "'Fraunces', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
  mono: "'Courier New', monospace"
};

@Component({
  selector: 'app-lector',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './lector.component.html',
  styleUrl: './lector.component.css'
})
export class LectorComponent implements OnInit {
  auth = inject(AuthService);
  private lector = inject(LectorService);
  private avisos = inject(AvisoService);
  private ruta = inject(ActivatedRoute);
  private id = Number(this.ruta.snapshot.paramMap.get('id'));
  private indiceActual = 0;

  id_ = this.id;
  fragmento = signal<Fragmento | null>(null);
  prefs = signal<PreferenciasLector>({ modoOscuro: false, tamanoLetra: 18, tipografia: 'serif', interlineado: 1.7 });
  cargando = signal(true);
  error = signal('');
  panelAbierto = signal(false);
  fuente = computed(() => FUENTES[this.prefs().tipografia] || FUENTES['serif']);
  progreso = computed(() => {
    const f = this.fragmento();
    return f ? Math.round(((f.indice + 1) / f.total) * 100) : 0;
  });

  ngOnInit() {
    this.lector.preferencias().subscribe({ next: (p) => this.prefs.set(p), error: () => {} });
    this.lector.registrarLectura(this.id).subscribe({ error: () => {} }); // queda en el registro interno de lecturas

    const continuar = this.ruta.snapshot.queryParamMap.get('continuar') === '1';
    if (continuar && this.auth.esSuscriptor()) {
      this.lector.punto(this.id).subscribe({
        next: (r) => this.cargar(r.punto),
        error: () => this.cargar(0)
      });
    } else {
      this.cargar(0);
    }
  }

  cargar(n: number) {
    this.cargando.set(true);
    this.error.set('');
    this.lector.fragmento(this.id, n).subscribe({
      next: (f) => {
        this.fragmento.set(f);
        this.indiceActual = f.indice;
        this.cargando.set(false);
        window.scrollTo({ top: 0 });
        if (this.auth.esSuscriptor()) this.lector.guardarPunto(this.id, f.indice).subscribe({ error: () => {} });
      },
      error: (e) => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }

  reintentar() { this.cargar(this.indiceActual); }
  siguiente() { const f = this.fragmento(); if (f && f.indice < f.total - 1) this.cargar(f.indice + 1); }
  anterior() { const f = this.fragmento(); if (f && f.indice > 0) this.cargar(f.indice - 1); }
  irA(valor: string) { this.cargar(Number(valor)); }

  @HostListener('window:keydown', ['$event'])
  teclas(e: KeyboardEvent) {
    const objetivo = e.target as HTMLElement;
    if (objetivo && ['INPUT', 'SELECT', 'TEXTAREA'].includes(objetivo.tagName)) return;
    if (e.key === 'ArrowRight') this.siguiente();
    if (e.key === 'ArrowLeft') this.anterior();
  }

  // Personalizacion: solo suscriptores (el backend tambien lo verifica)
  cambiar(cambio: Partial<PreferenciasLector>) {
    const nuevas = { ...this.prefs(), ...cambio };
    this.prefs.set(nuevas);
    this.lector.guardarPreferencias(nuevas).subscribe({
      error: (e) => this.avisos.error(mensajeError(e))
    });
  }
  cambiarTamano(delta: number) { this.cambiar({ tamanoLetra: Math.min(32, Math.max(14, this.prefs().tamanoLetra + delta)) }); }
  cambiarTipografia(valor: string) { this.cambiar({ tipografia: valor }); }
  cambiarInterlineado(valor: string) { this.cambiar({ interlineado: Number(valor) }); }
}
