import { Component, ChangeDetectorRef, OnDestroy, Output, EventEmitter, output } from '@angular/core';
import { MediaMatcher } from "@angular/cdk/layout";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: 'app-admin-nav-proveedor',
  standalone: true,
  imports: [MatToolbarModule, MatSidenavModule, RouterLinkActive,
    MatListModule, MatIconModule, RouterLink],
  templateUrl: './admin-nav-proveedor.component.html',
  styleUrls: ['./admin-nav-proveedor.component.scss']
})
export class AdminNavProveedorComponent  {




}
