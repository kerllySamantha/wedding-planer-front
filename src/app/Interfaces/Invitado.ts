import { BodaLigera } from "./Boda";
import { User } from "./User";

export interface Invitado {
    boda: BodaLigera,
    usuario: User
}

export interface Invitados {
    data: Invitado[];
}

export interface CreateInvitado{
    boda_id: number, 
    user_id : number,
}