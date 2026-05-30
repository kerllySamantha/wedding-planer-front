import { Component, inject, signal } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { UserResponse } from '../Interfaces/User';
import { MatCardModule } from '@angular/material/card';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { tap } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-login-usuarios',
  imports: [
    NavbarComponent,
    RouterLink,
    ReactiveFormsModule,
    NgClass,
    MatCardModule,
    MatIcon,
  ],
  templateUrl: './login-usuarios.component.html',
  styleUrl: './login-usuarios.component.scss',
})
export class LoginUsuariosComponent {
  constructor(private router: Router) {}

  authServicectx = inject(AuthenticationService);
  private readonly route = inject(ActivatedRoute);
  private readonly validated = signal<boolean>(false);
  nombreU = signal<string>('');
  message = signal<string>('');
  showPassword = signal(false);


  form = new FormGroup({
    email: new FormControl<string | null>('', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl<string | null>('', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/),
    ]),
  });

  togglePassword(): void {
  this.showPassword.update(value => !value);
}


  onSubmit(event: Event) {
    event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.set('Revisa el email y la contraseña.');
      return;
    }

    const email = this.form.controls.email.value ?? '';
    const password = this.form.controls.password.value ?? '';

    this.message.set('');

    this.authServicectx.login(email, password).subscribe({
      next: (response: UserResponse) => {
        const user = response.data;

        if (user.rol !== 'usuario') {
          this.message.set('Esta zona está reservada para usuarios.');
          return;
        }

        this.authServicectx['auth'].set(user);

        this.nombreU.set(user.name);

        localStorage.setItem('id', user.id.toString());
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('nombre', user.name);
        localStorage.setItem('rol', user.rol);

        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        this.router.navigateByUrl(redirect || '/');
      },

      error: (err) => {
        console.error('Error en login', err);
        this.message.set('Las credenciales introducidas son incorrectas.');
      },
    });
  }
}
