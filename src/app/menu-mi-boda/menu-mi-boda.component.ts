import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-menu-mi-boda',
  imports: [RouterLink],
  templateUrl: './menu-mi-boda.component.html',
  styleUrl: './menu-mi-boda.component.scss'
})
export class MenuMiBodaComponent {

  constructor(private router: Router) {

  }

  irARuta(ruta: string, event: Event): void {
    event.preventDefault();
    const urlActual = this.router.url;
    console.log(urlActual)

    if (urlActual.includes(ruta)) {
      console.log(`Ya estás en la ruta ${ruta}, no se navega nuevamente.`);
      return;
    }
  }

}
