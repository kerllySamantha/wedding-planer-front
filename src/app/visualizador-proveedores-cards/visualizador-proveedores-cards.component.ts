
import { Component, output } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-visualizador-proveedores-cards',
  imports: [ReactiveFormsModule, MatTabsModule],
  templateUrl: './visualizador-proveedores-cards.component.html',
  styleUrl: './visualizador-proveedores-cards.component.scss'
})
export class VisualizadorProveedoresCardsComponent {

  visualizador = output<'listado' | 'imagenes' | 'mapa'>();

  selectedIndex = 0;

  form = new FormGroup({
    modo: new FormControl<'listado' | 'imagenes' | 'mapa'>('listado')
  })

  // seleccionarModo(modo: 'listado' | 'imagenes' | 'mapa') {
  //   this.form.get('modo')?.setValue(modo);
  //   console.log(this.form.get('modo')?.value)
  //   this.visualizador.emit(modo);
  // }

  private modos: ('listado' | 'imagenes' | 'mapa')[] = ['listado', 'imagenes', 'mapa'];


  onTabChange(index: number) {
    const modo = this.modos[index];
    this.form.get('modo')?.setValue(modo);
    this.visualizador.emit(modo);
  }

  // seleccionarModo(modo: 'listado' | 'imagenes' | 'mapa') {
  //   const index = this.modos.indexOf(modo);
  //   this.selectedIndex = index;
  //   this.form.get('modo')?.setValue(modo);
  //   console.log(this.form.get('modo')?.value)
  //   this.visualizador.emit(modo);
  // }

}
