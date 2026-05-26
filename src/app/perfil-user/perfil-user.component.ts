import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { PerfilServiceServiceService } from '../Services/Perfiles/perfil-service-service.service';
import { NotificacionesService } from '../Services/Notificacion/notificaciones.service';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { EchoService } from '../Services/Echo/echo.service';
import { Notificacion, NotificacionResponse } from '../Interfaces/Notificacion';
import { CreatePerfilUsuario, PerfilResponse } from '../Interfaces/Perfil';
import { HttpErrorResponse } from '@angular/common/http';
import { Empresa } from '../Interfaces/Empresa';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { catchError, forkJoin, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { APP_PATHS } from '../app.paths';
import { RegionsServer } from '../Services/Regiones/regiones-abstract.server';
import { Town } from '../Interfaces/CIudades';
import { Boda, CreateBoda } from '../Interfaces/Boda';
import { CreateResenia, Resenia } from '../Interfaces/Resenia';
import { ReseniasServiceServiceService } from '../Services/Resenias/resenias-service-service.service';
import { EmpresasServiceServiceService } from '../Services/Empresas/empresas-service-service.service';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { PresupuestoHttpService } from '../Services/Presupuesto/presupuesto-http-service.service';
import { AuthenticationService } from '../Services/Autentication/authenticationService';

type PerfilUsuarioForm = {
  name: FormControl<string>;
  telefono: FormControl<string>;
  direccion: FormControl<string>;
  newPassword: FormControl<string>;
};

type BodaProfileForm = {
  nombrePareja: FormControl<string>;
  weddingDate: FormControl<string>;
  ubicacion: FormControl<string>;
  provinciaId: FormControl<number | null>;
  poblacionId: FormControl<number | null>;
  notas: FormControl<string>;
};

type ReseniaBodaForm = {
  empresaId: FormControl<string>;
  puntuacion: FormControl<string>;
  comentario: FormControl<string>;
};

@Component({
  selector: 'app-perfil-user',
  imports: [CommonModule, NavbarComponent, ReactiveFormsModule],
  templateUrl: './perfil-user.component.html',
  styleUrl: './perfil-user.component.scss',
})
export class PerfilUserComponent implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly perfilServiceCtx = inject(PerfilServiceServiceService);
  private readonly notificacionesCtx = inject(NotificacionesService);
  private readonly bodaCtx = inject(CountdownServiceService);
  private readonly echoSvc = inject(EchoService);
  private readonly pedirPresupuestoCtx = inject(PedirPresupuestoService);
  private readonly regionesServer = inject(RegionsServer);
  private readonly reseniasService = inject(ReseniasServiceServiceService);
  private readonly empresasService = inject(EmpresasServiceServiceService);
  private readonly presupuestoService = inject(PresupuestoHttpService);
  private readonly empresasApiSvc = inject(EmpresasApiServiceService);
  private readonly authSvc = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly perfil = signal<PerfilResponse | null>(null);
  readonly boda = this.bodaCtx.bodaEncontrada;
  readonly countdown = this.bodaCtx.countdownValue;
  readonly fechaFormateada = this.bodaCtx.fechaFormateada;
  readonly pestanaActiva = signal<'perfil' | 'boda' | 'solicitudes' | 'notificaciones' | 'resenias'>('perfil');

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly notificacionesLoading = signal<boolean>(false);
  readonly notificacionesError = signal<string | null>(null);
  readonly mensajeAccion = signal<string | null>(null);
  readonly expandedNotifId = signal<number | string | null>(null);
  readonly editandoPerfil = signal(false);
  readonly guardandoPerfil = signal(false);
  readonly perfilFormError = signal<string | null>(null);
  readonly perfilFormSuccess = signal<string | null>(null);
  readonly submittedPerfil = signal(false);
  readonly editandoBoda = signal(false);
  readonly guardandoBoda = signal(false);
  readonly submittedBoda = signal(false);
  readonly bodaFormError = signal<string | null>(null);
  readonly bodaFormSuccess = signal<string | null>(null);
  readonly uploadingFoto = signal(false);
  readonly reseniasBoda = signal<Resenia[]>([]);
  readonly reseniasLoading = signal(false);
  readonly reseniasError = signal<string | null>(null);
  readonly submittedResenia = signal(false);
  readonly enviandoResenia = signal(false);
  readonly reseniaSuccess = signal<string | null>(null);
  readonly reseniaError = signal<string | null>(null);
  readonly empresasResenia = signal<Empresa[]>([]);

  readonly perfilForm = new FormGroup<PerfilUsuarioForm>({
    name: this.fb.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(80),
    ]),
    telefono: this.fb.control('', [Validators.maxLength(20)]),
    direccion: this.fb.control('', [Validators.maxLength(255)]),
    newPassword: this.fb.control('', [Validators.minLength(8)]),
  });

  readonly bodaForm = new FormGroup<BodaProfileForm>({
    nombrePareja: this.fb.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(80),
    ]),
    weddingDate: this.fb.control('', [Validators.required]),
    ubicacion: this.fb.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(255),
    ]),
    provinciaId: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    poblacionId: new FormControl<number | null>(
      { value: null, disabled: true },
      { validators: [Validators.required] },
    ),
    notas: this.fb.control('', [Validators.maxLength(500)]),
  });

  readonly provincias$ = this.regionesServer.getProvincias();
  readonly poblaciones$ = this.bodaForm.controls.provinciaId.valueChanges.pipe(
    startWith(this.bodaForm.controls.provinciaId.value),
    tap((provinciaId) => {
      if (!provinciaId) {
        this.bodaForm.controls.poblacionId.reset(null, { emitEvent: false });
        this.bodaForm.controls.poblacionId.disable({ emitEvent: false });
        return;
      }

      this.bodaForm.controls.poblacionId.enable({ emitEvent: false });
    }),
    switchMap((provinciaId) =>
      provinciaId ? this.regionesServer.getTowns(provinciaId) : of([] as Town[]),
    ),
  );
  readonly fotoPerfilUrl = computed(() => {
    const user = this.perfil()?.data?.usuario as any;
    return (user?.fotoPerfil || user?.foto_perfil || null) as string | null;
  });

  readonly reseniasConEmpresa = computed(() =>
    this.reseniasBoda().map((resenia) => ({
      ...resenia,
      empresaNombre: resenia.empresa?.nombre || 'Empresa',
    })),
  );

  readonly reseniaForm = new FormGroup<ReseniaBodaForm>({
    empresaId: this.fb.control('', [Validators.required]),
    puntuacion: this.fb.control('', [Validators.required]),
    comentario: this.fb.control('', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(500),
    ]),
  });

  readonly notificacionesNoLeidas = computed(
    () => this.notificaciones().filter((n) => !this.esLeida(n)).length,
  );
  readonly solicitudesServidor = computed(() =>
    this.notificaciones()
      .filter((n) => this.esPresupuesto(n))
      .sort((a, b) => Number(b.id) - Number(a.id)),
  );
  readonly solicitudesReales = computed(() =>
    this.solicitudesServidor().filter((n) => this.esSolicitudReal(n)),
  );
  readonly solicitudesNoLeidas = computed(
    () => this.solicitudesReales().filter((n) => !this.esLeida(n)).length,
  );
  readonly totalOfertadoSolicitudes = computed(() =>
    this.solicitudesReales().reduce(
      (total, notif) => total + (this.importeOfertado(notif) ?? 0),
      0,
    ),
  );
  readonly totalPagadoSolicitudes = computed(() =>
    this.solicitudesReales()
      .filter((notif) => (this.estadoReservaSolicitud(notif) ?? '').toLowerCase() === 'confirmada')
      .reduce((total, notif) => total + (this.importeOfertado(notif) ?? 0), 0),
  );
  readonly totalPendienteSolicitudes = computed(() =>
    Math.max(0, this.totalOfertadoSolicitudes() - this.totalPagadoSolicitudes()),
  );
  readonly notificacionesGenerales = computed(() =>
    this.notificaciones()
      .filter((n) => !this.esPresupuesto(n))
      .sort((a, b) => Number(b.id) - Number(a.id)),
  );
  readonly notificacionesGeneralesNoLeidas = computed(
    () => this.notificacionesGenerales().filter((n) => !this.esLeida(n)).length,
  );

  readonly presupuestosOrdenados = computed(() =>
    [...(this.boda()?.presupuestos ?? [])].sort(
      (a, b) =>
        new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime(),
    ),
  );
  readonly presupuestoTotal = computed(() =>
    this.presupuestosOrdenados().reduce((total, p) => total + (p.monto_total ?? 0), 0),
  );
  readonly presupuestoPagado = computed(() =>
    this.presupuestosOrdenados().reduce((total, p) => total + (p.monto_pagado ?? 0), 0),
  );
  readonly presupuestoPendiente = computed(() =>
    Math.max(0, this.presupuestoTotal() - this.presupuestoPagado()),
  );
  readonly fotosResultado = computed(() => {
    const fotos = this.boda()?.resultado_evento?.fotos ?? this.boda()?.fotos ?? [];
    return (fotos as Array<{ path?: string; url?: string } | string>).map((foto) => {
      if (typeof foto === 'string') return { path: foto, url: foto };
      return { path: foto.path ?? foto.url ?? '', url: foto.url ?? foto.path ?? '' };
    });
  });

  private readonly aceptandoIds = signal<Set<string>>(new Set());
  private readonly aceptadosIds = signal<Set<string>>(new Set());
  private readonly rechazandoIds = signal<Set<string>>(new Set());
  private unsubscribeNotificaciones: (() => void) | null = null;

  constructor() {
    effect(() => {
      this.patchBodaForm(this.boda());
    });
  }

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('id'));

    if (!userId) {
      console.error('Usuario no identificado');
      return;
    }

   


    this.bodaCtx.cargarBodaDelUsuario();

    this.perfilServiceCtx.getPerfilByUserId(userId).subscribe({
      next: (res) => {
        this.perfil.set(res);
        const u = res?.data?.usuario as any;
        const foto = u?.fotoPerfil || u?.foto_perfil;
        if (foto) this.authSvc.updateAuthUser({ fotoPerfil: foto });
        this.cargarNotificaciones();
        this.cargarReseniasDeLaBoda(userId);
        this.cargarEmpresasParaResenia();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar perfil:', err);
      },
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeNotificaciones?.();
  }

  onFotoPerfilSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const ext = this.getImageExtension(file);
    const userId = Number(localStorage.getItem('id'));
    if (!ext || !userId) return;

    this.uploadingFoto.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result ?? '');
      if (!base64) { this.uploadingFoto.set(false); return; }

      this.empresasApiSvc.uploadImageBase64(base64, ext, userId).subscribe({
        next: (res) => {
          console.log('[foto] upload response completo:', res);
          const rawUrl = res.url || res.path || '';
          console.log('[foto] rawUrl capturado:', rawUrl);
          const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('/')
            ? rawUrl
            : rawUrl ? `/${rawUrl}` : '';
          console.log('[foto] url final para payload:', url);
          const perfilActual = this.perfil()?.data;
          const perfilId = String(perfilActual?.id ?? '');
          if (!perfilId || !url) {
            console.warn('[foto] perfilId o url vacíos, abortando:', { perfilId, url });
            this.uploadingFoto.set(false); return;
          }

          const payload: CreatePerfilUsuario = {
            name: perfilActual?.usuario?.name ?? '',
            email: perfilActual?.usuario?.email ?? '',
            password: '',
            direccion: perfilActual?.direccion ?? '',
            telefono: perfilActual?.telefono ?? '',
            poblacion_id: perfilActual?.poblacion?.id ?? 0,
            fecha_boda: '',
            foto_perfil: url,
          };
          console.log('[foto] payload enviado a editarPerfil:', payload);

          this.perfilServiceCtx.editarPerfil(perfilId, payload).subscribe({
            next: (resp) => {
              console.log('[foto] editarPerfil OK:', resp);
              this.uploadingFoto.set(false);
              this.perfil.update(current => {
                if (!current) return current;
                return {
                  ...current,
                  data: {
                    ...current.data,
                    usuario: { ...current.data.usuario, fotoPerfil: url },
                  },
                };
              });
              // Actualiza el signal de auth y localStorage para que el navbar refleje la foto
              this.authSvc.auth.update(u => u ? { ...u, fotoPerfil: url } : u);
              try {
                const stored = localStorage.getItem('user');
                if (stored) {
                  const parsed = JSON.parse(stored);
                  parsed.fotoPerfil = url;
                  localStorage.setItem('user', JSON.stringify(parsed));
                }
              } catch {}
            },
            error: (err) => {
              console.error('[foto] editarPerfil ERROR:', err);
              this.uploadingFoto.set(false);
            },
          });
        },
        error: (err) => {
          console.error('[foto] uploadImageBase64 ERROR:', err);
          this.uploadingFoto.set(false);
        },
      });
    };
    reader.readAsDataURL(file);
  }

  private getImageExtension(file: File): string | null {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : null;
  }

  cargarPerfil(userId: number): void {
    this.perfilServiceCtx.getPerfilByUserId(userId).subscribe({
      next: (res) => {
        this.perfil.set(res);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar perfil:', err);
      },
    });
  }

descargarPdf() {

  const bodaActual = this.boda();

  if (!bodaActual?.id) {
    console.error('No existe una boda válida');
    return;
  }

  this.presupuestoService
    .descargarPdfBoda(bodaActual.id)
    .subscribe({

      next: (blob) => {

        const url = URL.createObjectURL(blob);

        window.open(url);

        URL.revokeObjectURL(url);
      },

      error: (error) => {

        console.error('Error al descargar PDF', error);
      }
    });
}

  isInvalidBodaField<K extends keyof BodaProfileForm>(field: K): boolean {
    const control = this.bodaForm.controls[field];
    return control.invalid && (control.dirty || control.touched || this.submittedBoda());
  }

  getBodaFieldError(field: keyof BodaProfileForm): string {
    const control = this.bodaForm.controls[field];
    if (!control.errors) return '';

    const messages: Record<string, Record<string, string>> = {
      nombrePareja: {
        required: 'El nombre de la pareja es obligatorio.',
        minlength: 'Escribe al menos 2 caracteres.',
        maxlength: 'No superes los 80 caracteres.',
      },
      weddingDate: {
        required: 'La fecha de la boda es obligatoria.',
      },
      ubicacion: {
        required: 'La ubicacion es obligatoria.',
        minlength: 'Escribe al menos 3 caracteres.',
        maxlength: 'No superes los 255 caracteres.',
      },
      provinciaId: {
        required: 'Selecciona una provincia.',
      },
      poblacionId: {
        required: 'Selecciona una poblacion.',
      },
      notas: {
        maxlength: 'No superes los 500 caracteres.',
      },
    };

    const key = Object.keys(control.errors)[0];
    return messages[field]?.[key] ?? 'Campo invalido.';
  }

  isInvalidReseniaField<K extends keyof ReseniaBodaForm>(field: K): boolean {
    const control = this.reseniaForm.controls[field];
    return control.invalid && (control.dirty || control.touched || this.submittedResenia());
  }

  getReseniaFieldError(field: keyof ReseniaBodaForm): string {
    const control = this.reseniaForm.controls[field];
    if (!control.errors) return '';

    const messages: Record<string, Record<string, string>> = {
      empresaId: {
        required: 'Selecciona la empresa que quieres valorar.',
      },
      puntuacion: {
        required: 'Selecciona una puntuacion.',
      },
      comentario: {
        required: 'El comentario es obligatorio.',
        minlength: 'Escribe al menos 10 caracteres.',
        maxlength: 'No superes los 500 caracteres.',
      },
    };

    const key = Object.keys(control.errors)[0];
    return messages[field]?.[key] ?? 'Campo invalido.';
  }

  estrellasResenia(puntuacion: string | number | null | undefined): number[] {
    const total = Math.max(0, Math.min(5, Number(puntuacion) || 0));
    return Array.from({ length: total }, (_, index) => index);
  }

  enviarResenia(): void {
    const userId = Number(localStorage.getItem('id'));
    const userName = localStorage.getItem('nombre') ?? 'Usuario';

    this.submittedResenia.set(true);
    this.reseniaSuccess.set(null);
    this.reseniaError.set(null);

    if (this.reseniaForm.invalid) {
      this.reseniaForm.markAllAsTouched();
      return;
    }

    const empresa = this.empresasResenia().find(
      (item) => String(item.id) === this.reseniaForm.controls.empresaId.value,
    );

    if (!userId || !empresa?.id) {
      this.reseniaError.set('No se pudo preparar la reseña.');
      return;
    }

    const payload: CreateResenia = {
      user_id: String(userId),
      empresa_id: String(empresa.id),
      puntuacion: this.reseniaForm.controls.puntuacion.value,
      comentario: this.reseniaForm.controls.comentario.value.trim(),
      fotos: [],
    };

    this.enviandoResenia.set(true);

    this.reseniasService.postResenia(payload).subscribe({
      next: () => {
        const nuevaResenia: Resenia = {
          id: Date.now(),
          comentario: payload.comentario,
          puntuacion: payload.puntuacion,
          usuario: {
            id: userId,
            name: userName,
            rol: 'usuario',
          },
          empresa: {
            id: Number(empresa.id),
            nombre: empresa.nombre_empresa,
          },
          fotos: [],
        };

        this.reseniasBoda.update((actuales) => [nuevaResenia, ...actuales]);
        this.reseniaForm.reset({
          empresaId: '',
          puntuacion: '',
          comentario: '',
        });
        this.submittedResenia.set(false);
        this.enviandoResenia.set(false);
        this.reseniaSuccess.set('Tu reseña se ha guardado correctamente.');
      },
      error: (err: HttpErrorResponse) => {
        this.enviandoResenia.set(false);
        this.reseniaError.set(
          err.error?.message ??
            err.error?.mensaje ??
            'No se pudo guardar la reseña.',
        );
      },
    });
  }

  activarEdicionBoda(): void {
    this.pestanaActiva.set('boda');
    this.editandoBoda.set(true);
    this.submittedBoda.set(false);
    this.bodaFormError.set(null);
    this.bodaFormSuccess.set(null);
    this.patchBodaForm(this.boda());
  }

  cancelarEdicionBoda(): void {
    this.editandoBoda.set(false);
    this.submittedBoda.set(false);
    this.bodaFormError.set(null);
    this.bodaFormSuccess.set(null);
    this.patchBodaForm(this.boda());
  }

  guardarBoda(): void {
    this.submittedBoda.set(true);
    this.bodaFormError.set(null);
    this.bodaFormSuccess.set(null);

    if (this.bodaForm.invalid) {
      this.bodaForm.markAllAsTouched();
      return;
    }

    const payload: CreateBoda = {
      nombre_pareja: this.bodaForm.controls.nombrePareja.value.trim(),
      fecha_boda: this.bodaForm.controls.weddingDate.value,
      ubicacion: this.bodaForm.controls.ubicacion.value.trim(),
      notas: this.bodaForm.controls.notas.value.trim(),
      poblacion_id: Number(this.bodaForm.controls.poblacionId.value),
    };

    const bodaActual = this.boda();
    const request$ = bodaActual?.id
      ? this.bodaCtx.bodaservicectx.editarBoda(String(bodaActual.id), payload)
      : this.bodaCtx.bodaservicectx.postBoda(payload);

    this.guardandoBoda.set(true);

    request$.subscribe({
      next: () => {
        this.guardandoBoda.set(false);
        this.editandoBoda.set(false);
        this.bodaFormSuccess.set('La boda se ha actualizado correctamente.');
        this.bodaCtx.cargarBodaDelUsuario();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoBoda.set(false);
        this.bodaFormError.set(
          err.error?.message ??
            err.error?.mensaje ??
            'No se pudo guardar la boda.',
        );
      },
    });
  }

  presupuestoGastado(): number {
    const boda = this.boda();
    if (!boda?.presupuestos) return 0;
    return boda.presupuestos.reduce((total, p) => total + p.monto_total, 0);
  }

  seleccionarPestana(tab: 'perfil' | 'boda' | 'solicitudes' | 'notificaciones' | 'resenias'): void {
    this.pestanaActiva.set(tab);
  }

  activarEdicionPerfil(): void {
    this.editandoPerfil.set(true);
    this.submittedPerfil.set(false);
    this.perfilFormError.set(null);
    this.perfilFormSuccess.set(null);
    const p = this.perfil()?.data;
    this.perfilForm.patchValue({
      name: p?.usuario?.name ?? '',
      telefono: p?.telefono ?? '',
      direccion: p?.direccion ?? '',
      newPassword: '',
    });
  }

  cancelarEdicionPerfil(): void {
    this.editandoPerfil.set(false);
    this.submittedPerfil.set(false);
    this.perfilFormError.set(null);
    this.perfilFormSuccess.set(null);
  }

  isInvalidPerfilField<K extends keyof PerfilUsuarioForm>(field: K): boolean {
    const control = this.perfilForm.controls[field];
    return control.invalid && (control.dirty || control.touched || this.submittedPerfil());
  }

  getPerfilFieldError(field: keyof PerfilUsuarioForm): string {
    const control = this.perfilForm.controls[field];
    if (!control.errors) return '';
    const messages: Record<string, Record<string, string>> = {
      name: {
        required: 'El nombre es obligatorio.',
        minlength: 'Escribe al menos 2 caracteres.',
        maxlength: 'No superes los 80 caracteres.',
      },
      telefono: { maxlength: 'No superes los 20 caracteres.' },
      direccion: { maxlength: 'No superes los 255 caracteres.' },
      newPassword: { minlength: 'La contraseña debe tener al menos 8 caracteres.' },
    };
    const key = Object.keys(control.errors)[0];
    return messages[field]?.[key] ?? 'Campo inválido.';
  }

  guardarPerfil(): void {
    this.submittedPerfil.set(true);
    this.perfilFormError.set(null);
    this.perfilFormSuccess.set(null);
   
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    const perfilActual = this.perfil()?.data;
    if (!perfilActual?.id) {
      this.perfilFormError.set('No se encontró el perfil del usuario.');
      return;
    }

    const payload: CreatePerfilUsuario = {
      name: this.perfilForm.controls.name.value.trim(),
      email: perfilActual.usuario?.email ?? '',
      password: this.perfilForm.controls.newPassword.value || '',
      direccion: this.perfilForm.controls.direccion.value.trim(),
      telefono: this.perfilForm.controls.telefono.value.trim(),
      poblacion_id: perfilActual.poblacion?.id ?? 0,
      fecha_boda: '',
    };

    this.guardandoPerfil.set(true);

    this.perfilServiceCtx.editarPerfil(String(perfilActual.id), payload).subscribe({
      next: () => {
        this.guardandoPerfil.set(false);
        this.editandoPerfil.set(false);
        this.perfilFormSuccess.set('Perfil actualizado correctamente.');
        const userId = Number(localStorage.getItem('id'));
        if (userId) this.cargarPerfil(userId);
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoPerfil.set(false);
        this.perfilFormError.set(
          err.error?.message ?? err.error?.mensaje ?? 'No se pudo actualizar el perfil.',
        );
      },
    });
  }

  cargarNotificaciones(page = 1): void {
    const userId = Number(localStorage.getItem('id'));
    if (!userId) {
      this.notificacionesError.set('Usuario no identificado.');
      return;
    }

    this.notificacionesLoading.set(true);
    this.notificacionesError.set(null);

    this.notificacionesCtx.getNotificaciones(userId, page).pipe(
      map((paginated) => this.normalizarNotificaciones(paginated.data ?? [])),
      switchMap((base) => this.sincronizarSolicitudesPresupuesto(base)),
      switchMap((base) => this.anexarSolicitudesCreadas(base, userId)),
    ).subscribe({
      next: (notificaciones) => {
        this.notificaciones.set(notificaciones);
        this.notificacionesLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const msg =
          err.error?.message ??
          err.error?.mensaje ??
          'Error al cargar notificaciones.';
        this.notificacionesError.set(msg);
        this.notificacionesLoading.set(false);
      },
    });
  }

  eliminarNotificacion(notif: Notificacion): void {
    if (!notif?.id) return;

    this.notificacionesCtx.eliminarNotificacion(Number(notif.id)).subscribe({
      next: () => {
        this.notificaciones.update((prev) => prev.filter((n) => n.id !== notif.id));
        this.mensajeAccion.set('Notificación eliminada.');
      },
      error: (err: HttpErrorResponse) => {
        this.mensajeAccion.set(
          err.error?.message ??
          err.error?.mensaje ??
          'No se pudo eliminar la notificación.',
        );
      },
    });
  }

  toggleExpandNotification(notif: Notificacion): void {
    const id = notif?.id ?? null;
    this.expandedNotifId.update((current) => (current === id ? null : id));
  }

  estaExpandida(notif: Notificacion): boolean {
    return this.expandedNotifId() === (notif?.id ?? null);
  }

  esLeida(notif?: Notificacion | null): boolean {
    if (!notif) return false;
    const v = notif.leido;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    return false;
  }

  esPresupuesto(notif: Notificacion): boolean {
    const tipo = (notif?.tipo ?? '').toLowerCase();
    return tipo.includes('presupuesto');
  }

  esReserva(notif: Notificacion): boolean {
    const tipo = (notif?.tipo ?? '').toLowerCase();
    return tipo.includes('reserva');
  }

  presupuestoId(notif: Notificacion): string | null {
    const ref = notif?.referencia as Record<string, unknown> | null;
    const id =
      ref?.['pedir_presupuesto_id'] ??
      ref?.['solicitud_id'] ??
      ref?.['presupuesto_solicitud_id'] ??
      notif?.referencia_id ??
      null;

    return id != null ? String(id) : null;
  }

  importeOfertado(notif: Notificacion): number | null {
    const value = notif?.referencia?.importe_ofertado;
    if (value == null) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  esSolicitudReal(notif: Notificacion): boolean {
    const ref = notif?.referencia as Record<string, unknown> | null;
    if (!this.esPresupuesto(notif)) return false;
    const solicitudId =
      ref?.['pedir_presupuesto_id'] ??
      ref?.['solicitud_id'] ??
      ref?.['presupuesto_solicitud_id'] ??
      notif?.referencia_id ??
      null;
    if (!solicitudId) return false;

    return !!(
      ref?.['pedir_presupuesto_id'] ||
      ref?.['solicitud_id'] ||
      ref?.['presupuesto_solicitud_id'] ||
      ref?.['importe_ofertado'] != null ||
      ref?.['fecha_inicio'] ||
      ref?.['modalidad'] ||
      ref?.['empresa_id']
    );
  }

  estadoReservaSolicitud(notif: Notificacion): string | null {
    const ref = notif?.referencia as Record<string, any> | null;
    return (ref?.['reserva']?.estado ?? ref?.['estado_reserva'] ?? null) as string | null;
  }

  mostrarDetalleAceptada(notif: Notificacion): boolean {
    const estado = this.resolverEstadoPresupuesto(notif);
    return estado === 'aceptado_usuario' || this.estadoReservaSolicitud(notif) != null;
  }

  irAPublicarBoda(): void {
    this.router.navigate([`/${APP_PATHS.userWedding}`]);
  }

  productoServicioTexto(notif: Notificacion): string {
    const ref = notif?.referencia as Record<string, any> | null;
    return (
      ref?.['tipo_producto']?.nombre ??
      ref?.['producto']?.nombre ??
      ref?.['servicio']?.nombre ??
      ref?.['tipo_producto_nombre'] ??
      (ref?.['tipo_producto_id'] ? `Servicio #${ref?.['tipo_producto_id']}` : 'Servicio')
    );
  }

  private resolverEstadoPresupuesto(notif: Notificacion): string {
    const estado = notif?.referencia?.estado as unknown;
    if (!estado) return 'pendiente';

    if (typeof estado === 'string') {
      return estado.toLowerCase();
    }

    if (typeof estado === 'object') {
      const estadoObj = estado as Record<string, string>;
      return String(
        estadoObj['aceptado_usuario'] ||
          estadoObj['rechazado_usuario'] ||
          estadoObj['pendiente_usuario'] ||
          estadoObj['aceptado_empresa'] ||
          estadoObj['rechazado_empresa'] ||
          estadoObj['pendiente'] ||
          'pendiente',
      ).toLowerCase();
    }

    return 'pendiente';
  }

  estadoPresupuestoTexto(notif: Notificacion): string {
    switch (this.resolverEstadoPresupuesto(notif)) {
      case 'pendiente_usuario':
      case 'aceptado_empresa':
        return 'Pendiente de tu respuesta';
      case 'aceptado_usuario':
        return 'Aceptado';
      case 'rechazado_usuario':
        return 'Rechazado por ti';
      case 'rechazado_empresa':
        return 'Rechazado por proveedor';
      case 'pendiente':
        return 'Pendiente';
      default:
        return 'En gestión';
    }
  }

  puedeResponderPresupuesto(notif: Notificacion): boolean {
    const estado = this.resolverEstadoPresupuesto(notif);
    return (
      estado === 'pendiente_usuario' ||
      estado === 'aceptado_empresa' ||
      estado === 'pendiente'
    );
  }

  aceptandoPresupuesto(id: string | null): boolean {
    return id != null && this.aceptandoIds().has(id);
  }

  presupuestoAceptado(id: string | null): boolean {
    return id != null && this.aceptadosIds().has(id);
  }

  rechazandoPresupuesto(id: string | null): boolean {
    return id != null && this.rechazandoIds().has(id);
  }

  private setFlag(
    set$: ReturnType<typeof signal<Set<string>>>,
    id: string,
    value: boolean,
  ): void {
    set$.update((prev) => {
      const next = new Set(prev);
      value ? next.add(id) : next.delete(id);
      return next;
    });
  }

  marcarLeida(notif: Notificacion): void {
    if (!notif?.id || this.esLeida(notif)) return;

    this.notificacionesCtx.marcarLeida(notif.id).subscribe({
      next: (_res: NotificacionResponse) => {
        this.notificaciones.update((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, leido: true } : n)),
        );
      },
      error: () => {},
    });
  }

  abrirNotificacion(notif: Notificacion): void {
    if (this.esPresupuesto(notif)) {
      const id = this.presupuestoId(notif);

      if (id == null) {
        this.mensajeAccion.set('No se pudo abrir el detalle del presupuesto.');
        return;
      }

      this.router.navigate(['/presupuesto', id], {
        state: { presupuesto: notif.referencia ?? null },
      });
      return;
    }

    this.mensajeAccion.set('Abriendo detalle de la notificación.');
  }

  nombreProveedor(notif: Notificacion): string {
    const referencia = notif?.referencia as Record<string, any> | null;
    return (
      referencia?.['empresa']?.nombre ??
      referencia?.['proveedor']?.nombre ??
      referencia?.['nombre_empresa'] ??
      'Proveedor'
    );
  }

  tipoPresupuestoTexto(presupuesto: any): string {
    return (
      presupuesto?.tipos?.nombre ??
      presupuesto?.tipo_producto?.nombre ??
      presupuesto?.nombre ??
      'Servicio'
    );
  }

  estadoPresupuestoDesdePresupuesto(presupuesto: any): string {
    const notifMock = { referencia: { estado: presupuesto?.estado } } as Notificacion;
    return this.estadoPresupuestoTexto(notifMock);
  }

  verDetallePresupuesto(notif: Notificacion): void {
    this.abrirNotificacion(notif);
  }

  aceptarPresupuesto(notif: Notificacion): void {
    this.mensajeAccion.set(null);

    if (!this.esPresupuesto(notif)) {
      this.mensajeAccion.set(
        'Esta notificación no corresponde a un presupuesto.',
      );
      return;
    }

    const id = this.presupuestoId(notif);
    console.log('ACEPTAR PERFIL -> notif', notif);
    console.log('ACEPTAR PERFIL -> id enviado', id);

    if (id == null) {
      this.mensajeAccion.set('No se pudo identificar el presupuesto.');
      return;
    }

    if (this.aceptandoPresupuesto(id) || this.presupuestoAceptado(id)) return;

    this.setFlag(this.aceptandoIds, id, true);

    this.pedirPresupuestoCtx.aceptarPresupuesto(id).subscribe({
      next: (res) => {
        this.setFlag(this.aceptandoIds, id, false);
        this.setFlag(this.aceptadosIds, id, true);
        this.mensajeAccion.set('Fecha bloqueada correctamente.');
        console.log('ACEPTAR PERFIL -> respuesta backend', res);
        this.cargarNotificaciones();
      },
      error: (err: HttpErrorResponse) => {
        this.setFlag(this.aceptandoIds, id, false);
        const msg =
          err.error?.message ??
          err.error?.mensaje ??
          'No se pudo aceptar el presupuesto.';
        this.mensajeAccion.set(msg);
        console.error('ACEPTAR PERFIL -> error backend', err);
      },
    });
  }

  rechazarPresupuesto(notif: Notificacion): void {
    this.mensajeAccion.set(null);
    const id = this.presupuestoId(notif);

    if (id == null) {
      this.mensajeAccion.set('No se pudo identificar el presupuesto.');
      return;
    }
    if (this.rechazandoPresupuesto(id)) return;

    this.setFlag(this.rechazandoIds, id, true);

    this.pedirPresupuestoCtx.rechazarPresupuesto(id).subscribe({
      next: () => {
        this.setFlag(this.rechazandoIds, id, false);
        this.mensajeAccion.set('Presupuesto rechazado.');
        this.cargarNotificaciones();
      },
      error: (err: HttpErrorResponse) => {
        this.setFlag(this.rechazandoIds, id, false);
        const msg =
          err.error?.message ??
          err.error?.mensaje ??
          'No se pudo rechazar el presupuesto.';
        this.mensajeAccion.set(msg);
      },
    });
  }

  private normalizarNotificaciones(notificaciones: Notificacion[]): Notificacion[] {
    return notificaciones.map((notif) => {
      const referencia = notif?.referencia as Record<string, unknown> | null;
      const fallbackRefId = (
        referencia?.['pedir_presupuesto_id'] ??
        referencia?.['solicitud_id'] ??
        referencia?.['presupuesto_solicitud_id'] ??
        notif.referencia_id ??
        null
      ) as string | number | null;

      return {
        ...notif,
        referencia_id: fallbackRefId,
      };
    });
  }

  private sincronizarSolicitudesPresupuesto(
    notificaciones: Notificacion[],
  ): Observable<Notificacion[]> {
    const solicitudes = notificaciones
      .filter((notif) => this.esPresupuesto(notif))
      .map((notif) => ({
        notifId: notif.id,
        solicitudId: this.presupuestoId(notif),
      }))
      .filter((item) => item.solicitudId != null) as Array<{
      notifId: number;
      solicitudId: string;
    }>;

    if (solicitudes.length === 0) {
      return of(notificaciones);
    }

    const solicitudesUnicas = Array.from(
      new Set(solicitudes.map((item) => item.solicitudId)),
    );

    const requestMap: Record<string, Observable<any | null>> = {};
    solicitudesUnicas.forEach((id) => {
      requestMap[id] = this.pedirPresupuestoCtx.getPedirPresupuesto(id).pipe(
        catchError(() => of(null)),
      );
    });

    return forkJoin(requestMap).pipe(
      map((detallePorSolicitud) =>
        notificaciones.map((notif) => {
          if (!this.esPresupuesto(notif)) return notif;
          const solicitudId = this.presupuestoId(notif);
          if (!solicitudId) return notif;

          const solicitudActualizada = detallePorSolicitud[solicitudId] ?? null;
          if (!solicitudActualizada) return notif;

          return {
            ...notif,
            referencia_id: solicitudId,
            referencia: {
              ...(notif.referencia ?? {}),
              ...solicitudActualizada,
            },
          };
        }),
      ),
    );
  }

  private anexarSolicitudesCreadas(
    notificaciones: Notificacion[],
    userId: number,
  ): Observable<Notificacion[]> {
    return this.pedirPresupuestoCtx.getPedirPresupuestos().pipe(
      map((solicitudes) => {
        const delUsuario = (solicitudes ?? []).filter(
          (item) => Number(item.user_id) === Number(userId),
        );

        if (delUsuario.length === 0) return notificaciones;

        const existentes = new Set(
          notificaciones
            .map((notif) => this.presupuestoId(notif))
            .filter((id): id is string => id != null),
        );

        const nuevas = delUsuario
          .filter((solicitud) => {
            const id = solicitud.id != null ? String(solicitud.id) : null;
            return id != null && !existentes.has(id);
          })
          .map((solicitud) => this.crearNotificacionDesdeSolicitud(solicitud));

        return [...nuevas, ...notificaciones];
      }),
      catchError(() => of(notificaciones)),
    );
  }

  private crearNotificacionDesdeSolicitud(solicitud: any): Notificacion {
    const idSolicitud = solicitud?.id != null ? String(solicitud.id) : `tmp-${Date.now()}`;
    const syntheticId = Number(idSolicitud);
    const id = Number.isFinite(syntheticId) ? -Math.abs(syntheticId) : -Date.now();

    return {
      id,
      tipo: 'presupuesto',
      titulo: 'Solicitud enviada',
      mensaje: 'Tu solicitud fue enviada al proveedor y está pendiente de respuesta.',
      leido: false,
      referencia_id: idSolicitud,
      referencia: solicitud,
    };
  }

  private cargarReseniasDeLaBoda(userId: number): void {
    this.reseniasLoading.set(true);
    this.reseniasError.set(null);

    this.reseniasService.getResenias().subscribe({
      next: (response) => {
        const reseniasUsuario = (response?.data ?? []).filter(
          (resenia) => Number(resenia.usuario?.id) === Number(userId),
        );
        this.reseniasBoda.set(reseniasUsuario);
        this.reseniasLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.reseniasLoading.set(false);
        this.reseniasError.set(
          err.error?.message ??
            err.error?.mensaje ??
            'No se pudieron cargar las reseñas.',
        );
      },
    });
  }

  private cargarEmpresasParaResenia(): void {
    this.empresasService.getEmpresas().subscribe({
      next: (response) => {
        this.empresasResenia.set(response?.data ?? []);
      },
      error: () => {
        this.empresasResenia.set([]);
      },
    });
  }

  private patchBodaForm(boda: Boda | null): void {
    if (!boda) {
      this.bodaForm.reset({
        nombrePareja: '',
        weddingDate: '',
        ubicacion: '',
        provinciaId: null,
        poblacionId: null,
        notas: '',
      });
      this.bodaForm.controls.poblacionId.disable({ emitEvent: false });
      return;
    }

    this.bodaForm.patchValue({
      nombrePareja: boda.nombre_pareja ?? '',
      weddingDate: this.toInputDate(boda.fecha_boda),
      ubicacion: boda.ubicacion ?? '',
      provinciaId: boda.provincia?.id ?? null,
      poblacionId: boda.poblacion?.id ?? null,
      notas: boda.notas ?? '',
    });

    if (boda.provincia?.id) {
      this.bodaForm.controls.poblacionId.enable({ emitEvent: false });
    }
  }

  private toInputDate(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

}
