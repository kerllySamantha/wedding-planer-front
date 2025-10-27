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

export const routes: Routes = [
    { path: "", component: DashboardComponent },
    {
        path: "mi-boda", component: MiBodaComponent, children: [
            // { path: 'tools/presupuesto', component: ContenedorProveedoresComponent },
        ]
    },
    { path: 'tools/presupuesto', component: ContenedorProveedoresComponent },
    {
        path: "dashboard-empresas", component: DashboardEmpresasComponent
    },
    { path: "login", component: LoginUsuariosComponent },
    { path: "registerUser", component: RegistroUsuariosComponent },
    { path: "registerEmpresa", component: RegistroEmpresasComponent },

    {
        path: 'dashboard-proveedores', component: DashboardProveedoresComponent
    },


    { path: "perfil-user", component: PerfilUserComponent },
    { path: "proveedores/detalles/:id", component: DetallesProveedoresComponent, resolve: { proveedor: empresaResolver } },

    // { path: "dashboard-empresas/login-empresas", component: LoginEmpresasComponent}
];
