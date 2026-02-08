import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardEmpresasComponent } from './dashboard-empresas/dashboard-empresas.component';
import { LoginEmpresasComponent } from './login-empresas/login-empresas.component';
import { LoginUsuariosComponent } from './login-usuarios/login-usuarios.component';
import { RegistroUsuariosComponent } from './registro-usuarios/registro-usuarios.component';
import { RegistroEmpresasComponent } from './registro-empresas/registro-empresas.component';
import { MiBodaComponent } from './mi-boda/mi-boda.component';
import { PerfilUserComponent } from './perfil-user/perfil-user.component';
import { DashboardProveedoresComponent } from './dashboard-proveedores/dashboard-proveedores.component';
import { DetallesProveedoresComponent } from './detalles-proveedores/detalles-proveedores.component';
import { empresaResolver } from './Resolver/company.resolver';
import { ContenedorProveedoresComponent } from './contenedor-proveedores/contenedor-proveedores.component';
import { AdminDashboardProveedoresComponent } from './admin-dashboard-proveedores/admin-dashboard-proveedores.component';
import { rolredirectGuard } from './Guardias/rolredirect.guard';
import { rolGuard } from './Guardias/rol.guard';
import { CalendarProveedoresComponent } from './calendar-proveedores/calendar-proveedores.component';
import { CardEmpresaComponent } from './card-empresa/card-empresa.component';


export const routes: Routes = [
    {
        path: "",
        canActivate: [rolredirectGuard],
        children: []
    },

    { path: 'dashboard', component: DashboardComponent, 
    canActivate: [rolGuard],
    data: { rol: ['usuario'] }
     },

    {
        path: 'proveedor-dashboard',
        component: AdminDashboardProveedoresComponent,
        canActivate: [rolGuard],
        data: { rol: ['empresa'] }
    },
    {
        path: 'proveedor-dashboard/calendar-proveedor', component: CalendarProveedoresComponent,
        canActivate: [rolGuard],
        data: { rol: ['empresa'] }
    },

    {
        path: 'mi-boda',
        component: MiBodaComponent,
        canActivate: [rolGuard],
        data: { rol: ['usuario'] }, children: [
            // { path: 'tools/presupuesto', component: ContenedorProveedoresComponent },
        ]
    },
    { path: 'tools/presupuesto', component: ContenedorProveedoresComponent, canActivate: [rolredirectGuard] },
    {
        path: "dashboard-empresas", component: DashboardEmpresasComponent
    },
    { path: "login", component: LoginUsuariosComponent },
    { path: "registerUser", component: RegistroUsuariosComponent },
    { path: "registerEmpresa", component: RegistroEmpresasComponent },

    {
        path: 'dashboard-proveedores', component: DashboardProveedoresComponent, canActivate: [rolGuard]
    },


    { path: "perfil-user", component: PerfilUserComponent, canActivate: [rolGuard] },
    { path: "proveedores/detalles/:id", component: DetallesProveedoresComponent, resolve: { proveedor: empresaResolver } },

    // { path: "dashboard-empresas/login-empresas", component: LoginEmpresasComponent}
];
