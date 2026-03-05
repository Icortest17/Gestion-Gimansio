"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface TrendChartProps {
    data: { mes: string; total: number }[];
}

export function TrendChart({ data }: TrendChartProps) {
    // Tomar los últimos 6 meses para el gráfico
    const chartData = [...data].reverse().slice(-6);

    return (
        <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#e11d48', fontWeight: 'bold' }}
                        cursor={{ fill: '#18181b', opacity: 0.4 }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index === chartData.length - 1 ? "#e11d48" : "#27272a"}
                                className="transition-all duration-300 hover:fill-rose-500"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
