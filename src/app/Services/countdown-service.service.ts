import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Timespan } from '../Interfaces/Timespan';
import countdown from 'countdown';
import { BodaServiceServiceService } from './Bodas/boda-service-service.service';
import { AuthenticationService } from './Autentication/authenticationService';
import { Boda } from '../Interfaces/Boda';
import dayjs from 'dayjs';
import { Presupuesto } from '../Interfaces/Presupuesto';
import { Empresa } from '../Interfaces/Empresa';

@Injectable({
  providedIn: 'root'
})
export class CountdownServiceService {

  bodaservicectx = inject(BodaServiceServiceService);
  authService = inject(AuthenticationService);

  public countdownValue = signal<Timespan | null>(null);
  private intervalId: number | null = null;
  
  public boda = signal<Boda | null>(null);
  public loading = signal(true);
  public error = signal<string | null>(null);
  public fechaFormateada = signal<string>('');
  private totalesEdicion = signal<{ total: number; pagado: number; restante: number } | null>(null);
  public bodaEncontrada = computed(() => this.boda());
  private _bodaCargando = false;

private totalDesdeItems(presupuesto: any, campo: 'monto_estimado' | 'monto_pagado'): number | null {
  const items = presupuesto?.items_presupuesto ?? presupuesto?.items;
  if (!Array.isArray(items) || items.length === 0) return null;

  return items.reduce((acc: number, item: any) => acc + (+item?.[campo] || 0), 0);
}

public costeEstimado = computed(() => {
  const override = this.totalesEdicion();
  if (override) return override.total;
  const boda = this.bodaEncontrada();
  const presupuestos = boda?.presupuestos ?? [];
  return presupuestos.reduce((total, p) => {
    const totalItems = this.totalDesdeItems(p, 'monto_estimado');
   return total + (totalItems ?? (+p.monto_total || 0));
  }, 0);
});

public totalPagado = computed(() => {
  const override = this.totalesEdicion();
  if (override) return override.pagado;
  const boda = this.bodaEncontrada();
  const presupuestos = boda?.presupuestos ?? [];
  return presupuestos.reduce((total, p) => {
    const pagadoItems = this.totalDesdeItems(p, 'monto_pagado');
    return total + (pagadoItems ??( +p.monto_pagado! || 0));
  }, 0);
});


public totalRestante = computed(() => {
  const override = this.totalesEdicion();
  if (override) return override.restante;
  const boda = this.bodaEncontrada();
  const presupuestos = boda?.presupuestos ?? [];
  return presupuestos.reduce((total, p) => total + (+p.monto_restante! || 0), 0);
});

 setTotalesEnEdicion(total: number, pagado: number) {
  this.totalesEdicion.set({
    total: +total || 0,
    pagado: +pagado || 0,
    restante: (+total || 0) - (+pagado || 0)
  });
}


  limpiarTotalesEnEdicion() {
    this.totalesEdicion.set(null);
  }


  start(targetDate: Date) {
    this.stop();

    this.intervalId = countdown(
      targetDate,
      (ts: Timespan) => {
        this.countdownValue.set(ts);
      },
      countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS
    ) as unknown as number;

    return this.intervalId;
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  get value() {
    return this.countdownValue();
  }


  startCountdown(targetDate: Date) {
    this.stopCountdown();

    this.intervalId = countdown(
      targetDate,
      (ts: Timespan) => {
        this.countdownValue.set(ts);
      },
      countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS
    ) as unknown as number;
  }

  stopCountdown() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  cargarBodaDelUsuario() {
    if (this.boda() !== null || this._bodaCargando) return;

    const usuarioId = this.authService.usuario_id();
    if (!usuarioId) {
      this.error.set('No hay usuario logueado');
      this.loading.set(false);
      return;
    }

    this._bodaCargando = true;
    this.loading.set(true);

    this.bodaservicectx.getBodaByUserId(usuarioId).subscribe({
      next: (res) => {
        const bodaData = res?.data || null;
        this.boda.set(bodaData);

        if (bodaData?.fecha_boda) {
          const fechaBoda = new Date(bodaData.fecha_boda);
          this.fechaFormateada.set(dayjs(fechaBoda).format('DD [de] MMMM [de] YYYY'));
          this.startCountdown(fechaBoda);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this._bodaCargando = false;
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.stopCountdown();
  }



}
