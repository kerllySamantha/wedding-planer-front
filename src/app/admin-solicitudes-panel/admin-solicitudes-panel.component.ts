import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { PedirPresupuestoInfo } from '../Interfaces/PedirPresupuesto';
import { RouterLink } from "@angular/router";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-admin-solicitudes-panel',
  imports: [MatTableModule, CommonModule, RouterLink, MatIcon],
  templateUrl: './admin-solicitudes-panel.component.html',
  styleUrl: './admin-solicitudes-panel.component.scss',
})
export class AdminSolicitudesPanelComponent {

  pedirPresupuestosctx = inject(PedirPresupuestoService);
  arrayInfoPresupuestos = signal<PedirPresupuestoInfo[] | null>(null)
  idEmpresa = signal<string>(localStorage.getItem('idEmpresa')!)
  displayedColumns: string[] = ['fecha', 'importe', 'estado', 'email', 'acciones'];

  ngOnInit() {
    this.getPedirPresupuestoEmpresa();
  }

  getPedirPresupuestoEmpresa() {
    this.pedirPresupuestosctx.getEmpresaPedirPresupuesto(this.idEmpresa()).subscribe({
      next: (value) => {
        this.arrayInfoPresupuestos.set(value)
      },
    })
  }

  formaterFecha(fecha: string) {
    let nuevaFecha = fecha.split('T')[0];
    return nuevaFecha;
  }

}
