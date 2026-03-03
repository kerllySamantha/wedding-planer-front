import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-nav-proveedor',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-nav-proveedor.component.html',
  styleUrls: ['./admin-nav-proveedor.component.scss']
})
export class AdminNavProveedorComponent {}
