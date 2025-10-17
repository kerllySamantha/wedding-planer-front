import { Component, inject, signal } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { UserResponse } from '../Interfaces/User';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { tap } from 'rxjs';

@Component({
  selector: 'app-login-usuarios',
  imports: [NavbarComponent, RouterLink, ReactiveFormsModule, NgClass],
  templateUrl: './login-usuarios.component.html',
  styleUrl: './login-usuarios.component.scss'
})
export class LoginUsuariosComponent {

  constructor(private router: Router) {

  }

  authServicectx = inject(AuthenticationService);
  nombreU = signal<string>('');


  form = new FormGroup({
    email: new FormControl<string | null>('', [Validators.required, Validators.email]),
    password: new FormControl<string | null>('', [Validators.required, Validators.pattern("' ^ (?=.* [a - z])(?=.* [A - Z])(?=.*\d)(?=.* [\W_]).{ 8,}$'")])

  });

  onSubmit(event: Event) {
    event.preventDefault();
    const email = this.form.get('email')?.value ?? '';
    const password = this.form.get('password')?.value ?? '';


    this.authServicectx.login(email, password).subscribe({
      next: (response: UserResponse) => {

        this.authServicectx['auth'].set(response.data);
        localStorage.setItem('id', JSON.stringify(response.data.id));
        localStorage.setItem('user', JSON.stringify(response.data));
        this.nombreU.set(response.data.name);
        localStorage.setItem('nombre', this.nombreU());
        localStorage.setItem('rol', JSON.stringify(response.data.rol));
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error en login', err);
      }
    });



  }
}


