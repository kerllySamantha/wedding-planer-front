import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { of, startWith, switchMap, tap } from 'rxjs';
import { Provincia, Town } from '../Interfaces/CIudades';
import { UserResponse } from '../Interfaces/User';
import { CreatePerfilUsuario } from '../Interfaces/Perfil';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { RegionsServer } from '../Services/Regiones/regiones-abstract.server';
import { PerfilServiceServiceService } from '../Services/Perfiles/perfil-service-service.service';

type RegistroUsuarioForm = {
  name: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  provincia: FormControl<Provincia | null>;
  poblacion: FormControl<Town | null>;
  weddingDate: FormControl<string>;
  telefono: FormControl<string>;
  direccion: FormControl<string>;
};

@Component({
  selector: 'app-registro-usuarios',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './registro-usuarios.component.html',
  styleUrl: './registro-usuarios.component.scss',
})
export class RegistroUsuariosComponent {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private regionesServerctx = inject(RegionsServer);
  private perfilCtx = inject(PerfilServiceServiceService);
  private authServicectx = inject(AuthenticationService);

  submitted = false;
  loading = false;
  successMessage = '';
  generalError = '';
  showPassword = false;

  form = new FormGroup<RegistroUsuarioForm>({
    name: this.fb.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(80),
    ]),
    email: this.fb.control('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(255),
    ]),
    password: this.fb.control('', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(48),
    ]),
    provincia: new FormControl<Provincia | null>(null, {
      validators: [Validators.required],
    }),
    poblacion: new FormControl<Town | null>(
      { value: null, disabled: true },
      { validators: [Validators.required] },
    ),
    weddingDate: this.fb.control('', [Validators.required]),
    telefono: this.fb.control('', [
      Validators.required,
      Validators.pattern(/^[+]?\d[\d\s-]{6,14}$/),
    ]),
    direccion: this.fb.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(255),
    ]),
  });

  provincias$ = this.regionesServerctx.getProvincias();
  poblaciones$ = this.form.controls.provincia.valueChanges.pipe(
    startWith(this.form.controls.provincia.value),
    tap(() => {
      this.form.controls.poblacion.reset(null, { emitEvent: false });
      this.form.controls.poblacion.disable({ emitEvent: false });
    }),
    switchMap((provincia) =>
      provincia
        ? this.regionesServerctx
            .getTowns(provincia.id)
            .pipe(
              tap((items) =>
                items.length
                  ? this.form.controls.poblacion.enable({ emitEvent: false })
                  : this.form.controls.poblacion.disable({ emitEvent: false }),
              ),
            )
        : of([]),
    ),
  );

  isInvalid<K extends keyof RegistroUsuarioForm>(field: K): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.dirty || c.touched || this.submitted);
  }

  getError(field: keyof RegistroUsuarioForm): string {
    const c = this.form.controls[field];
    if (!c.errors) return '';
    const messages: Record<string, Record<string, string>> = {
      name: {
        required: 'El nombre es obligatorio.',
        minlength: 'Mínimo 2 caracteres.',
        maxlength: 'Máximo 80 caracteres.',
      },
      email: {
        required: 'El correo es obligatorio.',
        email: 'Introduce un correo válido.',
        maxlength: 'Máximo 255 caracteres.',
      },
      password: {
        required: 'La contraseña es obligatoria.',
        minlength: 'Mínimo 8 caracteres.',
        maxlength: 'Máximo 48 caracteres.',
      },
      provincia: { required: 'La provincia es obligatoria.' },
      poblacion: { required: 'La población es obligatoria.' },
      weddingDate: { required: 'La fecha de boda es obligatoria.' },
      telefono: {
        required: 'El teléfono es obligatorio.',
        pattern: 'Introduce un teléfono válido (7–15 dígitos).',
      },
      direccion: {
        required: 'La dirección es obligatoria.',
        minlength: 'Mínimo 5 caracteres.',
        maxlength: 'Máximo 255 caracteres.',
      },
    };
    const map = messages[field] ?? {};
    const key = Object.keys(c.errors)[0];
    return map[key] ?? 'Campo inválido.';
  }

  private toTitleCase(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted = true;
    this.generalError = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const normalizedName = this.toTitleCase(this.form.controls.name.value);
    this.form.controls.name.setValue(normalizedName, { emitEvent: false });
    const payload: CreatePerfilUsuario = {
      name: normalizedName,
      email: this.form.controls.email.value,
      password: this.form.controls.password.value,
      rol: 'usuario',
      direccion: this.form.controls.direccion.value,
      telefono: this.form.controls.telefono.value,
      poblacion_id: Number(this.form.controls.poblacion.value?.id) ?? 0,
     fecha_boda: new Date(this.form.controls.weddingDate.value).toISOString().split('T')[0],
    };

    this.perfilCtx.postPerfil(payload).subscribe({
      next: () => {
        this.successMessage = 'Registro completado. Iniciando sesión...';
        this.authServicectx.login(payload.email, payload.password).subscribe({
          next: (response: UserResponse) => {
            this.authServicectx['auth'].set(response.data);
            localStorage.setItem('id', response.data.id.toString());
            localStorage.setItem('user', JSON.stringify(response.data));
            localStorage.setItem('nombre', response.data.name);
            localStorage.setItem('rol', response.data.rol);
            if (response.token) localStorage.setItem('token', response.token);
            localStorage.setItem('ocultar_bodas_reales_nuevo_usuario', 'true');
            this.loading = false;
            this.router.navigate(['/perfil-user']);
          },
          error: () => {
            this.loading = false;
            this.generalError =
              'Usuario creado, pero no se pudo iniciar sesión automáticamente.';
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        console.log(this.generalError);
        this.generalError =
          err.error?.message ?? 'No se pudo completar el registro.';
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
