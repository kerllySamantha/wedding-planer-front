import { Component, inject, computed } from '@angular/core';
import { MenuMiBodaComponent } from "../menu-mi-boda/menu-mi-boda.component";
import { NavbarComponent } from "../navbar/navbar.component";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActividadesMiBodaComponent } from '../actividades-mi-boda/actividades-mi-boda.component';
import { FiltroEmpresasServiceService } from '../filtro-empresas-service.service';
import { AsyncPipe } from '@angular/common';
import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { map } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardMibodaEmpresaComponent } from '../card-miboda-empresa/card-miboda-empresa.component';
import { Router, RouterOutlet } from '@angular/router';
import { InfoCategoria } from '../Interfaces/Categoria';

@Component({
  selector: 'app-mi-boda',
  imports: [MenuMiBodaComponent, NavbarComponent, ActividadesMiBodaComponent, AsyncPipe,
    MatCardModule, MatButtonModule, AsyncPipe, ReactiveFormsModule, FormsModule,
     CardMibodaEmpresaComponent, RouterOutlet],
  templateUrl: './mi-boda.component.html',
  styleUrl: './mi-boda.component.scss'
})
export class MiBodaComponent {
  filtroEmpresas = inject(FiltroEmpresasServiceService);
  servicioDeCategorias = inject(CategoriasServiceService);
  nuevoInvitado = '';
  nuevaMesa = '';
  nuevoVestido = '';

  invitados: string[] = [];
  mesas: string[] = [];
  vestidos: string[] = [];

  private readonly storageKeys = {
    invitados: 'mi-boda-invitados',
    mesas: 'mi-boda-mesas',
    vestidos: 'mi-boda-vestidos',
  };

  constructor(private router: Router) {

  }

  ngOnInit() {
    this.invitados = this.readList(this.storageKeys.invitados);
    this.mesas = this.readList(this.storageKeys.mesas);
    this.vestidos = this.readList(this.storageKeys.vestidos);
  }

  companies = computed(() =>
    this.filtroEmpresas.empresasFiltradas()

  );

 
  categorias$ = this.servicioDeCategorias.getCategorias().pipe(
    map((data) =>
      (data?.data as InfoCategoria[] ?? []).filter((categoria) => (categoria.tipos ?? []).length > 0),
    ),
  );

  onCategoriaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const id = select.value ? Number(select.value) : null;
    this.filtroEmpresas.seleccionarCategoria(id);
  }

  addInvitado() {
    this.addItem('invitados', this.nuevoInvitado);
    this.nuevoInvitado = '';
  }

  addMesa() {
    this.addItem('mesas', this.nuevaMesa);
    this.nuevaMesa = '';
  }

  addVestido() {
    this.addItem('vestidos', this.nuevoVestido);
    this.nuevoVestido = '';
  }

  removeItem(type: 'invitados' | 'mesas' | 'vestidos', index: number) {
    this[type] = this[type].filter((_, i) => i !== index);
    this.persist(type);
  }

  private addItem(type: 'invitados' | 'mesas' | 'vestidos', value: string) {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    this[type] = [...this[type], cleanValue];
    this.persist(type);
  }

  private persist(type: 'invitados' | 'mesas' | 'vestidos') {
    localStorage.setItem(this.storageKeys[type], JSON.stringify(this[type]));
  }

  private readList(key: string): string[] {
    try {
      const value = localStorage.getItem(key);
      const parsed = value ? JSON.parse(value) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
