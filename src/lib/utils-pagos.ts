/* eslint-disable @typescript-eslint/no-explicit-any */
import { Database } from "../types/database.types";

export type Alumno = Database["public"]["Tables"]["perfiles_alumnos"]["Row"];
export type Pago = Database["public"]["Tables"]["registro_pagos"]["Row"];

export const getMesActual = () => {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const now = new Date();
    return `${meses[now.getMonth()]} ${now.getFullYear()}`;
};
