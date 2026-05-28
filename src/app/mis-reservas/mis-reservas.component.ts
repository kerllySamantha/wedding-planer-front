import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterUserComponent } from '../footer-user/footer-user.component';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { PedirPresupuestoInfo } from '../Interfaces/PedirPresupuesto';

type Filtro = 'todos' | 'pendiente' | 'aceptado' | 'rechazado';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, NgClass, NavbarComponent, FooterUserComponent],
  templateUrl: './mis-reservas.component.html',
  styleUrl: './mis-reservas.component.scss',
})
export class MisReservasComponent {
  private svc = inject(PedirPresupuestoService);

  presupuestos = signal<PedirPresupuestoInfo[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  filtro = signal<Filtro>('todos');

  ngOnInit() {
    this.svc.getPedirPresupuestos().subscribe({
      next: (res) => {
        this.presupuestos.set(res ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus solicitudes.');
        this.loading.set(false);
      },
    });
  }

  normalizarEstado(estado: any): string {
    if (!estado) return 'pendiente';
    if (typeof estado === 'string') return estado.toLowerCase();
    if (typeof estado === 'object') {
      return String(
        estado['aceptado_usuario'] ??
        estado['rechazado_usuario'] ??
        estado['aceptado_empresa'] ??
        estado['rechazado_empresa'] ??
        estado['pendiente_usuario'] ??
        estado['pendiente'] ??
        'pendiente'
      ).toLowerCase();
    }
    return 'pendiente';
  }

  etiquetaEstado(estado: any): string {
    const e = this.normalizarEstado(estado);
    const map: Record<string, string> = {
      pendiente: 'Pendiente',
      pendiente_usuario: 'Pendiente de ti',
      aceptado_empresa: 'Pendiente de ti',
      aceptado_usuario: 'Aceptado',
      rechazado_usuario: 'Rechazado',
      rechazado_empresa: 'Rechazado por proveedor',
    };
    return map[e] ?? 'En gestión';
  }

  claseEstado(estado: any): string {
    const e = this.normalizarEstado(estado);
    if (e === 'aceptado_usuario') return 'badge--green';
    if (e.includes('rechazado')) return 'badge--red';
    if (e === 'pendiente_usuario' || e === 'aceptado_empresa') return 'badge--orange';
    return 'badge--gray';
  }

  presupuestosFiltrados(): PedirPresupuestoInfo[] {
    const f = this.filtro();
    const lista = this.presupuestos();
    if (f === 'todos') return lista;
    return lista.filter(p => {
      const e = this.normalizarEstado(p.estado);
      if (f === 'pendiente') return e === 'pendiente' || e === 'pendiente_usuario' || e === 'aceptado_empresa';
      if (f === 'aceptado') return e === 'aceptado_usuario';
      if (f === 'rechazado') return e.includes('rechazado');
      return true;
    });
  }

  contarPorFiltro(f: Filtro): number {
    if (f === 'todos') return this.presupuestos().length;
    return this.presupuestos().filter(p => {
      const e = this.normalizarEstado(p.estado);
      if (f === 'pendiente') return e === 'pendiente' || e === 'pendiente_usuario' || e === 'aceptado_empresa';
      if (f === 'aceptado') return e === 'aceptado_usuario';
      if (f === 'rechazado') return e.includes('rechazado');
      return false;
    }).length;
  }
}
