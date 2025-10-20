import { Observable } from 'rxjs';
import { Provincia, Town, Poblaciones, PoblacionesProvincias } from '../../Interfaces/CIudades';


export abstract class RegionsServer {
    abstract getProvincias(): Observable<Provincia[]>;
    abstract getTowns(id: number): Observable<Town[]>;
    abstract getTotalTowns(): Observable<Poblaciones>;
    abstract getProvinciaPoblacion(id: number): Observable<Poblaciones[]>
}

