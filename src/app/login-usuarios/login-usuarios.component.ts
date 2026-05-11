import { Component, inject, signal } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { Router, RouterLink } from '@angular/router';
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
  nombreU = signal<string>('');
  message = signal<string>('');

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

  onSubmit(event: Event) {
    event.preventDefault();
    const email = this.form.get('email')?.value ?? '';
    const password = this.form.get('password')?.value ?? '';

    this.authServicectx.login(email, password).subscribe({
      next: (response: UserResponse) => {
        this.authServicectx['auth'].set(response.data);
        localStorage.setItem('id', response.data.id.toString());
        localStorage.setItem('user', JSON.stringify(response.data));
        this.nombreU.set(response.data.name);
        localStorage.setItem('nombre', this.nombreU());
        localStorage.setItem('rol', response.data.rol);
        if (response?.data.rol !== 'usuario') {
          this.message.set('Las credenciales ingresadas no son correctas.');
        } else {
          this.message.set('');
          this.router.navigate(['/']);
        }
      },

      error: (err) => {
        console.error('Error en login', err);
        this.message.set(
          'Las credenciales introducidas son incorrectas.',
        );
      },
    });
  }
}
