import { computed, inject, Injectable, resource, signal } from '@angular/core';
import { EmpresasServiceServiceService } from './Services/Empresas/empresas-service-service.service';
import { firstValueFrom } from 'rxjs';
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


  protected empresasResource = resource({
    loader: () => firstValueFrom(this.servicioDeEmpresas.getEmpresas())
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
