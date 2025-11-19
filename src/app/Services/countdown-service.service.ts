import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Timespan } from '../Interfaces/Timespan';
import countdown from 'countdown';
import { BodaServiceServiceService } from './Bodas/boda-service-service.service';
import { AuthenticationService } from './Autentication/authenticationService';
import { Boda } from '../Interfaces/Boda';
import dayjs from 'dayjs';

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
  public bodaEncontrada = computed(() => this.boda());
  public costeEstimado = computed(() => {
    const boda = this.bodaEncontrada();
    const presupuestos = boda?.presupuestos ?? [];
    return presupuestos.reduce((total, p) => total + (p.monto_total ?? 0), 0);
  });


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
    const usuarioId = this.authService.usuario_id();
    if (!usuarioId) {
      this.error.set('No hay usuario logueado');
      this.loading.set(false);
      return;
    }

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
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.stopCountdown();
  }



  constructor() {

    effect(() => {
      // this.costeEstimado();

      // const boda = this.countdownService.bodaEncontrada();
      // const total = boda?.presupuestos?.reduce((acc, p) => acc + p.monto_total, 0) ?? 0;
      // this.totalEstimado.set(total);
    });
  }
}
