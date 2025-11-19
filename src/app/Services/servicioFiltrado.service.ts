import { computed, Injectable, signal, inject, resource } from '@angular/core';

import { firstValueFrom } from 'rxjs';
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

  serviceEmpresa = inject(EmpresasServiceServiceService);

  protected empresasResource = resource({
    loader: () => firstValueFrom(this.serviceEmpresa.getEmpresas())
  });



  reloadEmpresas() {
    this.empresasResource.reload();
  }

  protected empresasRecibidas = computed(() => this.empresasResource.value()?.data ?? []);


  setFilters(filtros: Filtros) {
    this.filtros.set(filtros);
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
    let empresas = [...this.empresas()];
    const filtros = this.filtros();

    if (filtros) {
      const { nombre, direccion, provincia, poblacion, categoria } = filtros;
      empresas = empresas.filter(empresa =>
        (!nombre || empresa.nombre_empresa.toLowerCase().includes(nombre.toLowerCase())) &&
        (!poblacion || empresa.poblacion.id === poblacion) &&
        (!provincia || empresa.provincia.id === provincia) && 
        (!categoria || empresa.productos.some(producto => producto.categoria.id === categoria))

      );
    }

    console.log(empresas)
    // console.log(empresas)

    return empresas;
  });





}
