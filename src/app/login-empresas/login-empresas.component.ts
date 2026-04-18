import { Component, inject, signal } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { EmpresasServiceServiceService } from '../Services/Empresas/empresas-service-service.service';
import { switchMap, tap } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-login-empresas',
  imports: [RouterLink, ReactiveFormsModule, NgClass],
  templateUrl: './login-empresas.component.html',
  styleUrl: './login-empresas.component.scss',
})
export class LoginEmpresasComponent {
  constructor(private router: Router) {}

  authServicectx = inject(AuthenticationService);
  empresaServicectx = inject(EmpresasServiceServiceService);

  nombreU = signal<string>('');
  messageError = signal<string>('');
  error = signal<boolean>(false);
  enviado = signal<boolean>(false);

  mostrarPassword = false;
  loading = false;
  errorMensaje: string | null = null;

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  form = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/),
      ],
    }),
  });

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  campoInvalido(nombreCampo: 'email' | 'password'): boolean {
    const control = this.form.get(nombreCampo);
    return (
      !!control &&
      control.invalid &&
      (control.touched || control.dirty || this.enviado())
    );
  }

  onSubmit(event: Event) {
    event.preventDefault();

    this.enviado.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.loading = false;
      return;
    }

    const email = this.email?.value ?? '';
    const password = this.password?.value ?? '';

    this.loading = true;
    this.errorMensaje = null;
    this.error.set(false);
    this.messageError.set('');

    this.authServicectx
      .login(email, password)
      .pipe(
        tap((response) => {
          localStorage.setItem('user', JSON.stringify(response.data));
          localStorage.setItem('id', response.data.id.toString());
          localStorage.setItem('rol', response.data.rol);
          localStorage.setItem('token', response.token);
          this.authServicectx['auth'].set(response.data);
        }),
        switchMap((response) => {
          if (response?.data.rol !== 'empresa') {
            this.messageError.set(
              'Las credenciales ingresadas no son correctas.',
            );
            this.error.set(true);
            throw new Error('Rol incorrecto');
          }

          return this.empresaServicectx.getEmpresaByUser(response.data.id!);
        }),
      )
      .subscribe({
        next: (empresaResponse) => {
          this.loading = false;

          localStorage.setItem(
            'empresa',
            JSON.stringify(empresaResponse?.data),
          );
          localStorage.setItem(
            'idEmpresa',
            JSON.stringify(empresaResponse?.data.id),
          );

          this.router.navigate(['proveedor-dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.error.set(true);
          this.messageError.set(
            err?.error?.message ??
              'No se pudo iniciar sesión. Revisa tus credenciales.',
          );
          console.error('Error en el flujo:', err);
        },
      });
  }
}
