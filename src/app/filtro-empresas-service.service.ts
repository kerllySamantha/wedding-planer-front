import { computed, inject, Injectable, resource, signal } from '@angular/core';
import { EmpresasServiceServiceService } from './Services/Empresas/empresas-service-service.service';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { Empresa } from './Interfaces/Empresa';


@Injectable({
  providedIn: 'root'
})
export class FiltroEmpresasServiceService {

  private servicioDeEmpresas = inject(EmpresasServiceServiceService);
  

  loading = signal(true);
  error = signal<string | null>(null);
  categoriaSeleccionadaId = signal<number | null>(null);
  tipoSeleccionadoId = signal<number|null>(null)



  private toResourceError(error: unknown): Error {
    if (error instanceof Error) return error;
    const message = (error as { message?: string })?.message ?? 'Error desconocido al cargar empresas';
    return new Error(message);
  }

  protected empresasResource = resource({
    loader: () => firstValueFrom(
      this.servicioDeEmpresas.getEmpresas().pipe(
        catchError((error) => throwError(() => this.toResourceError(error)))
      )
    )
  });
  

  empresasRecibidas = computed(() =>
    this.empresasResource.value()?.data ?? []
  );

  private empresaTieneImagenes(empresa: Empresa): boolean {
    return (empresa.fotos?.length ?? 0) > 0;
  }

  empresasFiltradas = computed(() => {
    const idSeleccionado = this.categoriaSeleccionadaId();
    const todas = this.empresasRecibidas().filter((empresa) => this.empresaTieneImagenes(empresa));

    if (!idSeleccionado) return todas;

    return todas.filter(empresa =>
      empresa.productos.some(categoria =>
        categoria.categoria.id === idSeleccionado
      )
    );
  });


  seleccionarCategoria(id: number | null) {
    this.categoriaSeleccionadaId.set(id);
  }

  seleccionarTipo(id: number | null){
    this.tipoSeleccionadoId.set(id);
  }

  reloadEmpresas() {
    this.empresasResource.reload();
  }

}
