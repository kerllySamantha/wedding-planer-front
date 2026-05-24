import { computed, Injectable, signal, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { catchError, throwError } from 'rxjs';
import { Empresa } from '../Interfaces/Empresa';
import { Filtros } from '../Interfaces/Filtro';
import { EmpresasServiceServiceService } from './Empresas/empresas-service-service.service';

@Injectable({
  providedIn: 'root'
})
export class ServicioFiltrado {

  filtros = signal<Filtros | null>(null);
  factorOrden = signal<string>('name');
  orden = signal<string>('ascendente');
  paginaActual = signal<number>(1);

  serviceEmpresa = inject(EmpresasServiceServiceService);

  private toResourceError(error: unknown): Error {
    if (error instanceof Error) return error;
    const message = (error as { message?: string })?.message ?? 'Error desconocido al cargar empresas';
    return new Error(message);
  }

  protected empresasResource = rxResource({
    params: () => this.paginaActual(),
    stream: ({ params: page }) =>
      this.serviceEmpresa.getEmpresas(page).pipe(
        catchError((error) => throwError(() => this.toResourceError(error)))
      )
  });

  readonly isLoading = this.empresasResource.isLoading;

  readonly paginaMeta = computed(() => {
    const r = this.empresasResource.value() as any;
    console.log('[ServicioFiltrado] respuesta raw del backend:', r);

    // Formato A – paginate() de Laravel: { current_page, data, last_page, total, ... }
    // Formato B – Resource::collection()->paginate(): { data, links, meta: { current_page, ... } }
    // Formato C – wrapper { data: { current_page, data, last_page } }
    const meta = r?.meta ?? r?.data ?? r ?? {};

    return {
      currentPage: meta.current_page ?? r?.current_page ?? 1,
      lastPage:    meta.last_page    ?? r?.last_page    ?? 1,
      perPage:     meta.per_page     ?? r?.per_page     ?? 15,
      total:       meta.total        ?? r?.total        ?? 0,
    };
  });

  irAPagina(pagina: number) {
    const { lastPage } = this.paginaMeta();
    if (pagina < 1 || pagina > lastPage) return;
    this.paginaActual.set(pagina);
  }

  reloadEmpresas() {
    this.empresasResource.reload();
  }

  protected empresasRecibidas = computed(() => {
    const r = this.empresasResource.value() as any;
    // Formato A/B: r.data es el array de empresas
    // Formato C: r.data.data es el array (wrapper + paginador)
    const data = r?.data;
    if (Array.isArray(data)) return data as Empresa[];
    if (Array.isArray(data?.data)) return data.data as Empresa[];
    return [];
  });

  private empresaTieneImagenes(empresa: Empresa): boolean {
    return (empresa.fotos?.length ?? 0) > 0;
  }


  setFilters(filtros: Filtros) {
    this.filtros.set(filtros);
    this.paginaActual.set(1);
  }

  sortObjectByTag(value: string, empresa: Empresa) {
    switch (value) {
      case 'name':
        return empresa.nombre_empresa.toLowerCase();
      // case 'region':
      //   return empresa.provincia.id;
      // case 'town':
      //   return empresa.poblacion.id;

      // case 'category':
      //   return empresa.categoria
      case 'direccion':
        return empresa.direccion
      default:
        return empresa.nombre_empresa.toLowerCase();
    }
  }



  readonly empresas = computed(() =>
    [...this.empresasRecibidas()].sort((a, b) => {
      const factor = this.factorOrden();
      const mode = this.orden();

      const valA = this.sortObjectByTag(factor, a);
      const valB = this.sortObjectByTag(factor, b);

      return mode === 'descendente' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
    })
  );





  companiesTotalFiltered = computed(() => {
    let empresas = [...this.empresas()].filter((empresa) => this.empresaTieneImagenes(empresa));
    const filtros = this.filtros();

    if (filtros) {
      const { nombre, direccion, provincia, poblacion, categoria, tipos } = filtros;
      empresas = empresas.filter(empresa =>
        (!nombre || empresa.nombre_empresa.toLowerCase().includes(nombre.toLowerCase())) &&
        (!poblacion || empresa.poblacion.id === poblacion) &&
        (!provincia || empresa.provincia.id === provincia) && 
        (!categoria || empresa.productos.some(producto => producto.categoria.id === categoria))&&
        (!tipos || (Array.isArray(tipos)
          ? empresa.productos.some(producto => tipos.includes(producto.tipo_producto.id))
          : empresa.productos.some(producto => producto.tipo_producto.id === tipos)))
        

      );
    }

    console.log(empresas)
    // console.log(empresas)

    return empresas;
  });





}
