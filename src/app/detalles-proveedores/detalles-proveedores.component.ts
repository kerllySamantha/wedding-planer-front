import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Empresa } from '../Interfaces/Empresa';
import { Foto, Resenia } from '../Interfaces/Resenia';
import { ProductoEmpresa } from '../Interfaces/Producto';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { ModalDetallesPresupuestoComponent } from '../modal-detalles-presupuesto/modal-detalles-presupuesto.component';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { ReseniasServiceServiceService } from '../Services/Resenias/resenias-service-service.service';

@Component({
  selector: 'app-detalles-proveedores',
  imports: [NavbarComponent, MatGridListModule],
  templateUrl: './detalles-proveedores.component.html',
  standalone: true,
  styleUrl: './detalles-proveedores.component.scss'
})
export class DetallesProveedoresComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authCtx = inject(AuthenticationService);
  private readonly reseniasService = inject(ReseniasServiceServiceService);
  private readonly router = inject(Router);
  protected empresaId = this.route.snapshot.params['id'];

  private fotosConRatio = signal<{ foto: Foto; ratio: number }[]>([]);
  productos = signal<ProductoEmpresa[]>([]);
  resenias = signal<Resenia[]>([]);
  reseniasLoading = signal(false);
  reseniasError = signal<string | null>(null);
  reviewCreated = signal(this.route.snapshot.queryParamMap.get('review') === 'created');

  fotoPrincipal = computed(() => this.fotosOrdenadas()[0] || null);
  puedeResenar = computed(() => this.authCtx.auth() && this.authCtx.rol() === 'usuario');
  puntuacionMedia = computed(() => {
    const listado = this.resenias();
    if (!listado.length) return 0;
    const total = listado.reduce((sum, item) => sum + (Number(item.puntuacion) || 0), 0);
    return total / listado.length;
  });

  private empresaRoute = toSignal(
    this.route.data.pipe(
      map(data => {
        const proveedor = data['proveedor'] as Empresa | { data?: Empresa } | null | undefined;
        return (proveedor as { data?: Empresa } | null)?.data ?? (proveedor as Empresa | null) ?? null;
      })
    ),
    { initialValue: null }
  );

  protected empresa = signal<Empresa | null>(null);

  constructor(private dialog: MatDialog) {
    effect(() => {
      const data = this.empresaRoute();
      if (data) {
        this.empresa.set(data);
        this.cargarReseniasEmpresa(Number(data.id));
      }
    });

    effect(() => {
      const empresa = this.empresa();
      if (!empresa) return;

      const fotos = empresa.fotos || [];
      if (fotos.length > 0) {
        this.cargarRatios(fotos);
      }

      this.productos.set(empresa.productos || []);
    });
  }

  fotosOrdenadas = computed(() => {
    const lista = [...this.fotosConRatio()];
    return lista.sort((a, b) => b.ratio - a.ratio).map(f => f.foto);
  });

  private cargarRatios(fotos: Foto[]) {
    const resultados: { foto: Foto; ratio: number }[] = [];
    fotos.forEach(foto => {
      const img = new Image();
      img.src = foto.url;
      img.onload = () => {
        const ratio = img.naturalHeight / img.naturalWidth;
        resultados.push({ foto, ratio });
        if (resultados.length === fotos.length) {
          this.fotosConRatio.set(resultados);
        }
      };
    });
  }

  abrirModal() {
    if (!this.authCtx.auth()) {
      this.router.navigate(['/login'], {
        queryParams: { redirect: `/proveedores/detalles/${this.empresaId}` },
      });
      return;
    }

    const dialogRef = this.dialog.open(ModalDetallesPresupuestoComponent, {
      data: {
        'empresa': this.empresa(),
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      console.log('Datos recibidos al cerrar el modal:', result);
    });
  }

  estrellas(puntuacion: string | number | null | undefined): number[] {
    const total = Math.max(0, Math.min(5, Number(puntuacion) || 0));
    return Array.from({ length: total }, (_, index) => index);
  }

  irANuevaResenia(): void {
    const empresaId = this.empresa()?.id ?? this.empresaId;

    if (!this.puedeResenar()) {
      this.router.navigate(['/login'], {
        queryParams: { redirect: `/proveedores/detalles/${empresaId}/resenas/nueva` },
      });
      return;
    }

    this.router.navigate(['/proveedores/detalles', empresaId, 'resenas', 'nueva']);
  }

  cerrarMensajeReviewCreada(): void {
    this.reviewCreated.set(false);
  }

  private cargarReseniasEmpresa(idEmpresa: number): void {
    if (!idEmpresa) return;

    this.reseniasLoading.set(true);
    this.reseniasError.set(null);

    this.reseniasService.getReseniaByEmpresa(idEmpresa).subscribe({
      next: (response) => {
        this.resenias.set(response?.data ?? []);
        this.reseniasLoading.set(false);
      },
      error: (error: { error?: { message?: string; mensaje?: string } }) => {
        this.reseniasLoading.set(false);
        this.reseniasError.set(
          error?.error?.message ??
          error?.error?.mensaje ??
          'No se pudieron cargar las resenas.',
        );
      },
    });
  }
}
