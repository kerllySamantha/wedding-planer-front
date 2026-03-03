import { Component, input } from '@angular/core';
import { Resenia } from '../Interfaces/Resenia';
import { MatIcon } from "@angular/material/icon";
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card-resenias-admin-valoradas',
  imports: [MatIcon, MatCardModule],
  standalone: true,
  templateUrl: './card-resenias-admin-valoradas.component.html',
  styleUrl: './card-resenias-admin-valoradas.component.scss',
})
export class CardReseniasAdminValoradasComponent {
  resenia = input<Resenia| null>(null);

}
