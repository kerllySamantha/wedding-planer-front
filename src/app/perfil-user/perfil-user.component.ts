import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { PerfilServiceServiceService } from '../Services/Perfiles/perfil-service-service.service';
import { Perfil, PerfilResponse } from '../Interfaces/Perfil';

@Component({
  selector: 'app-perfil-user',
  imports: [CommonModule, NavbarComponent],
  templateUrl: './perfil-user.component.html',
  styleUrl: './perfil-user.component.scss'
})
export class PerfilUserComponent {

  countdownService = inject(CountdownServiceService);
  perfilServicectx = inject(PerfilServiceServiceService);


  userPerfil = signal<Perfil | null>(null);
  public loading = signal(true);
  public error = signal<string | null>(null);


  bodaEncontrada = computed(() => this.countdownService.bodaEncontrada());
  fechaCountdown = computed(() => this.countdownService.countdownValue());
  fechaFormateada = computed(() => this.countdownService.fechaFormateada())

  perfil = computed(() => this.userPerfil());





  ngOnInit() {
    this.cargarPerfilDelUsuario();
    this.countdownService.cargarBodaDelUsuario();

  }






  cargarPerfilDelUsuario() {
    const usuarioId = Number(localStorage.getItem('id'));
    if (!usuarioId) {
      this.error.set('No hay usuario logueado');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.perfilServicectx.getPerfilByUserId(usuarioId).subscribe({
      next: (res) => {
        const perfilData = res || null;
        this.userPerfil.set(perfilData?.data || null);
        console.log(this.perfil())
        console.log(this.fechaFormateada())

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }



}
