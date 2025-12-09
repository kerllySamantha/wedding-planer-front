import { Component, inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserResponse } from '../Interfaces/User';
import { AuthenticationService } from '../Services/Autentication/authenticationService';


@Component({
  selector: 'app-login-empresas',
  imports: [RouterLink, ɵInternalFormsSharedModule, ReactiveFormsModule],
  templateUrl: './login-empresas.component.html',
  styleUrl: './login-empresas.component.scss'
})
export class LoginEmpresasComponent {

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
        this.router.navigate(['proveedor-dashboard']);
      },
      error: (err) => {
        console.error('Error en login', err);
      }
    });




  }
}
