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

export const getStartAndEndOfMonth = (mesStr: string) => {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const [mes, anio] = mesStr.split(' ');
    const mesIndex = meses.indexOf(mes);
    if (mesIndex === -1) return { start: '', end: '' };

    const year = parseInt(anio);
    const start = `${year}-${String(mesIndex + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, mesIndex + 1, 0).getDate();
    const end = `${year}-${String(mesIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return { start, end };
};

export const generateListMonths = () => {
    const result = [];
    const date = new Date();
    date.setMonth(date.getMonth() - 6); // Hasta 6 meses atrás
    const mesesInfo = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    for (let i = 0; i < 12; i++) {
        result.push(`${mesesInfo[date.getMonth()]} ${date.getFullYear()}`);
        date.setMonth(date.getMonth() + 1);
    }
    return result;
};
export const formatDateToMes = (dateStr: string) => {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const date = new Date(dateStr);
    return `${meses[date.getMonth()]} ${date.getFullYear()}`;
};
