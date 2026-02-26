import { Component, input } from '@angular/core';
import { Resenia } from '../Interfaces/Resenia';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-card-resenias-admin-valoradas',
  imports: [MatIcon],
  standalone: true,
  templateUrl: './card-resenias-admin-valoradas.component.html',
  styleUrl: './card-resenias-admin-valoradas.component.scss',
})
export class CardReseniasAdminValoradasComponent {
  resenia = input<Resenia| null>(null);
}
