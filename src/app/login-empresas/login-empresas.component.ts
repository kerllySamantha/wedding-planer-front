import { Component, inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { EmpresasServiceServiceService } from '../Services/Empresas/empresas-service-service.service';
import { switchMap, tap } from 'rxjs';




@Component({
  selector: 'app-login-empresas',
  imports: [RouterLink,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule],
  templateUrl: './login-empresas.component.html',
  styleUrl: './login-empresas.component.scss'
})
export class LoginEmpresasComponent {

  constructor(private router: Router) {

  }

  authServicectx = inject(AuthenticationService);
  empresaServicectx = inject(EmpresasServiceServiceService);
  nombreU = signal<string>('');
  messageError = signal<string>('');
  error = signal<boolean>(false);



  form = new FormGroup({
    email: new FormControl<string | null>('', [Validators.required, Validators.email]),
    password: new FormControl<string | null>('', [Validators.required, Validators.pattern("' ^ (?=.* [a - z])(?=.* [A - Z])(?=.*\d)(?=.* [\W_]).{ 8,}$'")])

  });

  onSubmit(event: Event) {
    event.preventDefault();
    const email = this.form.get('email')?.value ?? '';
    const password = this.form.get('password')?.value ?? '';



    this.authServicectx.login(email, password).pipe(
      tap(response => {
        localStorage.setItem('user', JSON.stringify(response.data));
        this.authServicectx['auth'].set(response.data);
         localStorage.setItem('id', response.data.id.toString());
        localStorage.setItem('rol', response.data.rol);
      }),
      switchMap(response => {
        if (response?.data.rol !== "empresa") {
          this.messageError.set("Las credenciales ingresadas no son correctas.");
          this.error.set(true);

          throw new Error("Rol incorrecto");
        }
        this.error.set(false);
        this.messageError.set("");
        return this.empresaServicectx.getEmpresaByUser(response.data.id!);
      })
    ).subscribe({
      next: (empresaResponse) => {
        console.log("Empresa obtenida:", empresaResponse);
         localStorage.setItem('empresa', JSON.stringify(empresaResponse?.data));
        localStorage.setItem('idEmpresa', JSON.stringify(empresaResponse?.data.id));
        this.router.navigate(['proveedor-dashboard']);
      },
      error: (err) => console.error("Error en el flujo:", err)
    });

  }

}

