import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Empresa } from '../Interfaces/Empresa';
import { Estadistica, Foto, Resenia } from '../Interfaces/Resenia';
import { ProductoEmpresa } from '../Interfaces/Producto';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { ModalDetallesPresupuestoComponent } from '../modal-detalles-presupuesto/modal-detalles-presupuesto.component';
import { ModalGaleriaFotosComponent } from '../modal-galeria-fotos/modal-galeria-fotos.component';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { ReseniasServiceServiceService } from '../Services/Resenias/resenias-service-service.service';
import Swal from 'sweetalert2';
import { FooterUserComponent } from "../footer-user/footer-user.component";

@Component({
  selector: 'app-detalles-proveedores',
  imports: [NavbarComponent, MatGridListModule, FooterUserComponent],
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
  estadisticas = signal<Estadistica | null>(null);
  reseniasLoading = signal(false);
  reseniasError = signal<string | null>(null);
  reviewCreated = signal(this.route.snapshot.queryParamMap.get('review') === 'created');

  fotoPrincipal = computed(() => this.fotosOrdenadas()[0] || null);
  puedeResenar = computed(() => this.authCtx.auth() && this.authCtx.rol() === 'usuario');
  estadisticasOrdenadas = computed(() =>
    [...(this.estadisticas()?.estrellas ?? [])].sort((a, b) => b.rating - a.rating)
  );
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

  abrirGaleriaFotos(): void {
    const fotos = this.fotosOrdenadas();
    if (!fotos.length) return;

    this.dialog.open(ModalGaleriaFotosComponent, {
      data: {
        fotos,
        indiceInicial: 0,
        nombreEmpresa: this.empresa()?.nombre_empresa,
      },
      panelClass: 'galeria-dialog',
      maxWidth: '95vw',
      maxHeight: '95vh',
    });
  }

  abrirModal() {
    if (!this.authCtx.auth()) {
      Swal.fire({
        icon: 'info',
        title: 'Inicia sesión primero',
        text: 'Debes estar logueado en la plataforma para solicitar un presupuesto.',
        confirmButtonText: 'Ir al login',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f76c6f',
      }).then(result => {
        if (result.isConfirmed) {
          this.router.navigate(['/login'], {
            queryParams: { redirect: `/proveedores/detalles/${this.empresaId}` },
          });
        }
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
    const total = Math.max(0, Math.min(5, Math.floor(Number(puntuacion) || 0)));
    return Array.from({ length: total }, (_, index) => index);
  }

  estrellasVacias(puntuacion: string | number | null | undefined): number[] {
    const total = Math.max(0, Math.min(5, Math.floor(Number(puntuacion) || 0)));
    return Array.from({ length: 5 - total }, (_, index) => index);
  }

  inicialesUsuario(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  }

  colorAvatar(name: string): string {
    const palette = ['#c0737e', '#7b9ec4', '#7baa8a', '#a07bc4', '#c4997b', '#7bbac4'];
    const index = [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % palette.length;
    return palette[index];
  }

  irANuevaResenia(): void {
    const empresaId = this.empresa()?.id ?? this.empresaId;

    if (!this.puedeResenar()) {
      Swal.fire({
        icon: 'info',
        title: 'Inicia sesión primero',
        text: 'Debes estar logueado en la plataforma para escribir una reseña.',
        confirmButtonText: 'Ir al login',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f76c6f',
      }).then(result => {
        if (result.isConfirmed) {
          this.router.navigate(['/login'], {
            queryParams: { redirect: `/proveedores/detalles/${empresaId}/resenas/nueva` },
          });
        }
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
        this.estadisticas.set(response?.estadisticas ?? null);
        this.reseniasLoading.set(false);
      },
      error: (error: { error?: { message?: string; mensaje?: string } }) => {
        this.reseniasLoading.set(false);
        this.reseniasError.set(
          error?.error?.message ??
          error?.error?.mensaje ??
          'No se pudieron cargar las reseñas.',
        );
      },
    });
  }
}
