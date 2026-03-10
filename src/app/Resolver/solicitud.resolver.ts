import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';

import { map } from 'rxjs';
import { PedirPresupuestoInfo } from '../Interfaces/PedirPresupuesto';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';

export const solicitudResolver: ResolveFn<PedirPresupuestoInfo> = (route, state) => {
  return inject(PedirPresupuestoService).getPedirPresupuesto(route.params['id']).pipe(
    map(empresa => empresa as PedirPresupuestoInfo))
  
};
