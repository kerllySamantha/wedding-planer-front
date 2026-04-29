import { Component, computed, effect, inject, Signal, signal } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { ActivatedRoute, Route } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, Observable, tap } from 'rxjs';
import { Empresa } from '../Interfaces/Empresa';
import { Foto } from '../Interfaces/Resenia';
import { AsyncPipe } from '@angular/common';
import { ProductoEmpresa } from '../Interfaces/Producto';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { ModalDetallesPresupuestoComponent } from '../modal-detalles-presupuesto/modal-detalles-presupuesto.component';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-detalles-proveedores',
  imports: [NavbarComponent, MatGridListModule],
  templateUrl: './detalles-proveedores.component.html',
  standalone: true,
  styleUrl: './detalles-proveedores.component.scss'
})
export class DetallesProveedoresComponent {

  private route = inject(ActivatedRoute);
  private readonly authCtx = inject(AuthenticationService);
  private readonly router = inject(Router);
  protected empresaId = this.route.snapshot.params['id'];

  private fotosConRatio = signal<{ foto: Foto; ratio: number }[]>([]);
  productos = signal<ProductoEmpresa[]>([]);

  fotoPrincipal = computed(() => this.fotosOrdenadas()[0] || null);


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
        queryParams: { redirect: `/proveedores/${this.empresaId}` },
      });
      return;
    }

    const dialogRef = this.dialog.open(ModalDetallesPresupuestoComponent, {
      // width: '400px',
      data: {
        'empresa': this.empresa(),
      }
    },

    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      console.log('Datos recibidos al cerrar el modal:', result);
    });
  }


}
