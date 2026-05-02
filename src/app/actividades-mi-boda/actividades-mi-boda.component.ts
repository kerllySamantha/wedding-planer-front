import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { BodaServiceServiceService } from '../Services/Bodas/boda-service-service.service';

import { count, firstValueFrom, map, tap } from 'rxjs';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { Boda } from '../Interfaces/Boda';;
import 'dayjs/locale/es';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';
import countdown, { } from 'countdown';
import { Timespan } from '../Interfaces/Timespan';
import { CountdownServiceService } from '../Services/countdown-service.service';

dayjs.extend(localizedFormat);
dayjs.locale('es');

@Component({
  selector: 'app-actividades-mi-boda',
  imports: [],
  templateUrl: './actividades-mi-boda.component.html',
  styleUrl: './actividades-mi-boda.component.scss'
})
export class ActividadesMiBodaComponent {

  countdownService = inject(CountdownServiceService);

  ngOnInit() {
    this.countdownService.cargarBodaDelUsuario();
  }

  ngOnDestroy() {
    this.countdownService.stopCountdown();
  }



  // boda = signal<Boda | null>(null);
  // loading = signal(true);
  // error = signal<string | null>(null);
  // fechaFormateada = signal<string>('');
  // fechaBoda = signal<Date | null>(null);
  // contador = signal<number | null>(null);



  bodaEncontrada = computed(() => this.countdownService.bodaEncontrada());
  fechaCountdown = computed(() => this.countdownService.countdownValue());
  fechaFormateada = computed(() => this.countdownService.fechaFormateada())


  formatearNombrePareja(nombre: string | null | undefined): string {
    if (!nombre) return 'Nuestra Boda';

    const palabras = nombre
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1));

    const primerasDos = palabras.slice(0, 2).join(' ');
    return primerasDos || 'Nuestra Boda';
  }


  // ngOnInit() {
  //   this.cargarBodaDelUsuario();
  // }

  // ngOnDestroy() {
  //   this.countdownService.stop();
  // }

  // cargarBodas() {
  //   this.loading.set(true);
  //   this.bodaservicectx.getBodas().subscribe({
  //     next: (data) => {
  //       console.log('📡 Bodas obtenidas:', data);
  //       this.bodas.set(data?.data ?? []);
  //       this.loading.set(false);
  //     },
  //     error: (err: Error) => {
  //       console.error('Error al obtener bodas:', err);
  //       this.error.set(err.message);
  //       this.loading.set(false);
  //     }
  //   });
  //}

  // bodaencontrada = computed(() => {
  //   const idSeleccionado = this.authService.usuario_id();
  //   const todas = this.bodas();

  //   if (!idSeleccionado) {
  //     console.log('No hay usuario logueado todavía');
  //     return [];
  //   }

  //   const filtradas = todas.filter(b => Number(b.usuario?.id) === idSeleccionado);
  //   console.log('Boda(s) encontradas para usuario', idSeleccionado, filtradas);

  //   return filtradas;
  // });

  // formatearFechaEffect = effect(() => {
  //   const boda = this.boda();
  //   if (boda?.fecha_boda) {
  //     this.fechaFormateada.set(dayjs(boda.fecha_boda).format('DD [de] MMMM [de] YYYY'));
  //   }
  // });





  // cargarBodaDelUsuario() {
  //   const usuarioId = this.authService.usuario_id();
  //   if (!usuarioId) {
  //     this.error.set('No hay usuario logueado');
  //     this.loading.set(false);
  //     return;
  //   }

  //   this.loading.set(true);

  //   this.bodaservicectx.getBodaByUserId(usuarioId).subscribe({
  //     next: (res) => {
  //       this.boda.set(res?.data || null);

  //       const fechaBoda = this.boda()?.fecha_boda ? new Date(this.boda()!.fecha_boda) : null;

  //       if (fechaBoda) {
  //         this.countdownService.start(fechaBoda);
  //       }

  //       // Formateo de la fecha
  //       if (this.boda()?.fecha_boda) {
  //         this.fechaFormateada.set(dayjs(this.boda()!.fecha_boda).format('DD [de] MMMM [de] YYYY'));
  //       }

  //       this.loading.set(false);
  //     },
  //     error: (err) => {
  //       this.error.set(err.message);
  //       this.loading.set(false);
  //     }
  //   });
  // }


}


