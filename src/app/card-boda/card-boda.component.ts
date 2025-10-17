import { Component, input } from '@angular/core';
import { Boda } from '../Interfaces/Boda';

@Component({
  selector: 'app-card-boda',
  imports: [],
  templateUrl: './card-boda.component.html',
  styleUrl: './card-boda.component.scss'
})
export class CardBodaComponent {
  boda = input<Boda | null>();

}
