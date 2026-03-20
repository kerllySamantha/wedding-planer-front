import { ApplicationConfig, importProvidersFrom, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './Interceptors/auth.interceptor';
import { UsuariosServiceService } from './Services/Users/usuarios-service.service';
import { UsuariosApiServiceService } from './Services/Users/usuarios-api-service.service';
import { EmpresasServiceServiceService } from './Services/Empresas/empresas-service-service.service';
import { EmpresasApiServiceService } from './Services/Empresas/empresas-api-service.service';
import { PerfilServiceServiceService } from './Services/Perfiles/perfil-service-service.service';
import { PerfilApiServiceService } from './Services/Perfiles/perfil-api-service.service';
import { API_URL } from './Tokens/serviceTokens';
import { ReseniasServiceServiceService } from './Services/Resenias/resenias-service-service.service';
import { ReseniasApiServiceService } from './Services/Resenias/resenias-api-service.service';
import { BodaServiceServiceService } from './Services/Bodas/boda-service-service.service';
import { BodaApiServiceService } from './Services/Bodas/boda-api-service.service';
import { CategoriasServiceService } from './Services/Catergorias/categoria-service.service';
import { CategoriasApiServiceService } from './Services/Catergorias/categoria-api-service.service';
import { AuthenticationService } from './Services/Autentication/authenticationService';
import { AutenticarHttpClientService } from './Services/Autentication/autenticar-http-client.service';
import { RegionsServer } from './Services/Regiones/regiones-abstract.server';
import { RegionesApiServer } from './Services/Regiones/regiones-api.server';
import { TiposHttpService } from './Services/Tipos/tipos-http.service';
import { TiposApiService } from './Services/Tipos/tipos-api.service';
import { ItemsDetallesService } from './Services/ItemDetalles/items-detalles.service';
import { ItemsDetallesApiService } from './Services/ItemDetalles/items-detalles-api.service';
import { PresupuestoHttpService } from './Services/Presupuesto/presupuesto-http-service.service';
import { PresupuestoApiService } from './Services/Presupuesto/presupuesto-api.service';
import { ReservasApiServiceService } from './Services/Reservas/reservas-api-service.service';
import { ReservasServiceServiceService } from './Services/Reservas/reservas-service-service.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { IconSetService } from '@coreui/icons-angular';
import { PedirPresupuestoService } from './Services/PedirPresupuestos/pedir-presupuesto.service';
import { PedirPresupuestoApiService } from './Services/PedirPresupuestos/pedir-presupuesto-api.service';
import { NotificacionesApiService } from './Services/Notificacion/notificaciones-api.service';
import { NotificacionesService } from './Services/Notificacion/notificaciones.service';
const url_back = 'http://localhost:8000/api';
const url_local = "http://weddingplaner.local/api";
export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
  provideHttpClient(
    withInterceptors([authInterceptor]),
    withXsrfConfiguration({
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    })
  ),
  // provideHttpClient(),
  { provide: UsuariosServiceService, useExisting: UsuariosApiServiceService },
  { provide: EmpresasServiceServiceService, useExisting: EmpresasApiServiceService },
  { provide: ReseniasServiceServiceService, useExisting: ReseniasApiServiceService },
  { provide: ReservasServiceServiceService, useExisting: ReservasApiServiceService },
  { provide: BodaServiceServiceService, useExisting: BodaApiServiceService },
  { provide: PerfilServiceServiceService, useExisting: PerfilApiServiceService },
  { provide: CategoriasServiceService, useExisting: CategoriasApiServiceService },
  { provide: AuthenticationService, useExisting: AutenticarHttpClientService },
  { provide: API_URL, useValue: url_local },
  { provide: RegionsServer, useExisting: RegionesApiServer },
  { provide: TiposHttpService, useExisting: TiposApiService },
  { provide: ItemsDetallesService, useExisting: ItemsDetallesApiService },
  { provide: PresupuestoHttpService, useExisting: PresupuestoApiService },
  {provide: NotificacionesService, useExisting: NotificacionesApiService},
  {provide: PedirPresupuestoService, useExisting:  PedirPresupuestoApiService},
  { provide: LOCALE_ID, useValue: 'es' },
  provideNativeDateAdapter(),
    IconSetService




  ]
};
