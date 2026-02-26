import { Component, inject, signal } from '@angular/core';
import { ReseniasApiServiceService } from '../Services/Resenias/resenias-api-service.service';
import { Resenia, Resenias } from '../Interfaces/Resenia';
import { CommonModule } from '@angular/common';
import { CardReseniasAdminValoradasComponent } from '../card-resenias-admin-valoradas/card-resenias-admin-valoradas.component';
import { SinValoracionesCardComponent } from "../sin-valoraciones-card/sin-valoraciones-card.component";

@Component({
  selector: 'app-resenias-admin-valoradas',
  standalone: true,
  imports: [CommonModule, CardReseniasAdminValoradasComponent, SinValoracionesCardComponent],
  templateUrl: './resenias-admin-valoradas.component.html',
  styleUrl: './resenias-admin-valoradas.component.scss',
})
export class ReseniasAdminValoradasComponent {
  reseniasctx = inject(ReseniasApiServiceService);
  reseniasPositivas = signal<Resenia[] | null>(null);
  reseniasNegativas = signal<Resenia[] | null>(null);
  empresaId = signal<string>(localStorage.getItem('idEmpresa')!)

  ngOnInit() {
    this.getReseniasFiltradasMejor();
    this.getReseniasFiltradasPeor();
  }

  getReseniasFiltradasMejor() {
    this.reseniasctx.getReseniaByFiltro(Number(this.empresaId()), 'positivas').subscribe({
      next: (data) => {
        this.reseniasPositivas.set(data?.data!);
        console.log(this.reseniasPositivas())
      },
    })
  }

  getReseniasFiltradasPeor() {
    this.reseniasctx.getReseniaByFiltro(Number(this.empresaId()), 'negativas').subscribe({
      next: (data) => {
        this.reseniasNegativas.set(data?.data!);
        console.log(this.reseniasNegativas())
      },
    })
  }

}
