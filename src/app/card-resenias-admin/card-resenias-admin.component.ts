import { CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { ReseniasApiServiceService } from '../Services/Resenias/resenias-api-service.service';
import { Resenia, Resenias } from '../Interfaces/Resenia';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-card-resenias-admin',
  imports: [CommonModule, MatCardModule, MatIcon, MatButton],
  templateUrl: './card-resenias-admin.component.html',
  styleUrl: './card-resenias-admin.component.scss',
})
export class CardReseniasAdminComponent {

  resenia = input<Resenia| null>(null);
  expandido = signal<boolean>(false);
  toggleExpandido() {
  this.expandido.update(v => !v);
}
}