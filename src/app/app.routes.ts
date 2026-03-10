import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardEmpresasComponent } from './dashboard-empresas/dashboard-empresas.component';
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
import { CardsDashboardProveedorComponent } from './cards-dashboard-proveedor/cards-dashboard-proveedor.component';
import { ReseniasAdminComponent } from './resenias-admin/resenias-admin.component';
import { ConfiguracionAdminComponent } from './configuracion-admin/configuracion-admin.component';
import { AdminSolicitudesDashboardComponent } from './admin-solicitudes-dashboard/admin-solicitudes-dashboard.component';
import { CardInfoSolicitudComponent } from './card-info-solicitud/card-info-solicitud.component';
import { solicitudResolver } from './Resolver/solicitud.resolver';
import { APP_PATHS } from './app.paths';

const userOnly = {
    canActivate: [rolGuard],
    data: { rol: ['usuario'] }
};

const providerOnly = {
    canActivate: [rolGuard],
    data: { rol: ['empresa'] }
};

const publicRoutes: Routes = [
    {
        path: APP_PATHS.home,
        component: DashboardComponent
    },
    {
        path: APP_PATHS.publicSuppliers,
        component: DashboardProveedoresComponent
    },
    {
        path: `${APP_PATHS.supplierDetails}/:id`,
        component: DetallesProveedoresComponent,
        resolve: { proveedor: empresaResolver }
    },
    {
        path: APP_PATHS.budgetTool,
        component: ContenedorProveedoresComponent,
        canActivate: [rolredirectGuard]
    },
    {
        path: APP_PATHS.companyArea,
        component: DashboardEmpresasComponent
    }
];

const authRoutes: Routes = [
    { path: APP_PATHS.login, component: LoginUsuariosComponent },
    { path: APP_PATHS.registerUser, component: RegistroUsuariosComponent },
    { path: APP_PATHS.registerCompany, component: RegistroEmpresasComponent }
];

const userRoutes: Routes = [
    {
        path: APP_PATHS.userWedding,
        component: MiBodaComponent,
        ...userOnly
    },
    {
        path: APP_PATHS.userProfile,
        component: PerfilUserComponent,
        ...userOnly
    }
];

const providerRoutes: Routes = [
    {
        path: APP_PATHS.providerDashboard,
        component: AdminDashboardProveedoresComponent,
        ...providerOnly,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: CardsDashboardProveedorComponent
            },
            {
                path: 'calendar',
                component: CalendarProveedoresComponent
            },
            {
                path: 'configuracion',
                component: ConfiguracionAdminComponent
            },
            {
                path: 'resenias',
                component: ReseniasAdminComponent
            },
            {
                path: 'solicitudes',
                component: AdminSolicitudesDashboardComponent
            },
            {
                path: 'solicitudes/:id',
                component: CardInfoSolicitudComponent,
                resolve: { solicitud: solicitudResolver }
            }
        ]
    }
];

const legacyRedirects: Routes = [
    { path: 'empresas', redirectTo: APP_PATHS.companyArea, pathMatch: 'full' },
    { path: 'registro/usuario', redirectTo: APP_PATHS.registerUser, pathMatch: 'full' },
    { path: 'registro/empresa', redirectTo: APP_PATHS.registerCompany, pathMatch: 'full' },
    { path: 'usuario', redirectTo: APP_PATHS.userWedding, pathMatch: 'full' },
    { path: 'usuario/mi-boda', redirectTo: APP_PATHS.userWedding, pathMatch: 'full' },
    { path: 'usuario/perfil', redirectTo: APP_PATHS.userProfile, pathMatch: 'full' },
    { path: 'empresa/solicitudes', redirectTo: APP_PATHS.providerRequests, pathMatch: 'full' },
    { path: 'empresa/solicitudes/:id', redirectTo: `${APP_PATHS.providerRequests}/:id`, pathMatch: 'full' }
];

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        canActivate: [rolredirectGuard],
        children: []
    },
    ...publicRoutes,
    ...authRoutes,
    ...userRoutes,
    ...providerRoutes,
    ...legacyRedirects,
    {
        path: '**',
        redirectTo: APP_PATHS.home
    }
];
