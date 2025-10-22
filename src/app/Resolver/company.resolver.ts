import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { Empresa } from '../Interfaces/Empresa';
import { EmpresasServiceServiceService } from '../Services/Empresas/empresas-service-service.service';
import { map } from 'rxjs';

export const empresaResolver: ResolveFn<Empresa> = (route, state) => {
  return inject(EmpresasServiceServiceService).getEmpresa(route.params['id']).pipe(
    map(empresa => empresa as Empresa))
  
};
