"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface TrendChartProps {
    data: { mes: string; total: number; ingresos?: number; gastos?: number }[];
}

export function TrendChart({ data }: TrendChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Tomar los últimos 6 meses para el gráfico
    const chartData = [...data].reverse().slice(-6).map(d => ({
        mes: d.mes,
        ingresos: d.ingresos ?? Math.max(0, d.total),
        gastos: d.gastos ?? Math.abs(Math.min(0, d.total)),
    }));

    if (!mounted) return <div className="h-[200px] w-full mt-4 bg-zinc-900/10 animate-pulse rounded-lg" />;

    return (
        <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                    <XAxis
                        dataKey="mes"
                        stroke="#71717a"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value.split(" ")[0].substring(0, 3)}
                    />
                    <YAxis
                        stroke="#71717a"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}€`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #27272a', borderRadius: '8px', fontSize: '11px' }}
                        cursor={{ fill: '#18181b', opacity: 0.4 }}
                        formatter={(value: any, name: any) => [
                            `${Number(value).toLocaleString()}€`,
                            name === 'ingresos' ? '💰 Ingresos' : '📉 Gastos'
                        ]}
                    />
                    <Bar dataKey="ingresos" fill="#34d399" radius={[4, 4, 0, 0]} name="ingresos" />
                    <Bar dataKey="gastos" fill="#fb7185" radius={[4, 4, 0, 0]} name="gastos" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
