import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BodaApiServiceService } from '../Services/Bodas/boda-api-service.service';
import { Boda } from '../Interfaces/Boda';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterUserComponent } from '../footer-user/footer-user.component';
import { APP_PATHS } from '../app.paths';

@Component({
  selector: 'app-boda-detalle',
  standalone: true,
  imports: [NavbarComponent, FooterUserComponent, RouterLink],
  templateUrl: './boda-detalle.component.html',
  styleUrl: './boda-detalle.component.scss',
})
export class BodaDetalleComponent {
  private route = inject(ActivatedRoute);
  private bodaSvc = inject(BodaApiServiceService);

  boda = signal<Boda | null>(null);
  cargando = signal(true);
  fotoSeleccionada = signal<string | null>(null);
  readonly APP_PATHS = APP_PATHS;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.cargando.set(false);
      return;
    }
    console.log(id);

    this.bodaSvc.getBoda(BigInt(id)).subscribe({
      next: (resp: any) => {
        const boda = resp?.data ?? resp;

        this.boda.set(boda);

        const primeraFoto = boda?.fotos?.[0];

        if (primeraFoto) {
          this.fotoSeleccionada.set(
            this.resolverUrl(primeraFoto.url, primeraFoto.path),
          );
        }

        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  resolverUrl(url?: string | null, path?: string | null): string {
    const c = (url ?? '').trim() || (path ?? '').trim();
    if (!c) return 'assets/images/fondo3.jpg';
    if (
      c.startsWith('http://') ||
      c.startsWith('https://') ||
      c.startsWith('data:')
    )
      return c;
    return c.startsWith('/') ? c : `/${c}`;
  }

  seleccionarFoto(foto: { url?: string | null; path?: string | null }) {
    this.fotoSeleccionada.set(this.resolverUrl(foto.url, foto.path));
  }

  estrellas(puntuacion: number): number[] {
    const n = Math.round(Number(puntuacion));
    return Array.from({ length: 5 }, (_, i) => (i < n ? 1 : 0));
  }

  formatFecha(fecha: Date | string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
