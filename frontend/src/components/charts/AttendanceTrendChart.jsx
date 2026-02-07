import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

const AttendanceTrendChart = ({ data, compact = false }) => {
    // Generate mock trend data for last 7 days
    const chartData = data || Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
            date: format(date, 'dd MMM', { locale: id }),
            hadir: Math.floor(Math.random() * 10) + 40,
            terlambat: Math.floor(Math.random() * 5),
        };
    });

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-xs">
                    <p className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-1">{label}</p>
                    <p className="text-green-600 font-semibold mb-1">
                        Hadir: {payload[0].value}
                    </p>
                    <p className="text-yellow-600 font-semibold">
                        Terlambat: {payload[1].value}
                    </p>
                </div>
            );
        }
        return null;
    };

    const heightClass = compact ? 'h-[220px]' : 'h-[300px]';
    return (
        <div className={`w-full ${heightClass} bg-white rounded-3xl p-3`}>
            <h3 className="text-xs md:text-sm font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Tren Kedatangan (7 Hari)</h3>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorTelat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#ca8a04" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="hadir"
                        stroke="#16a34a"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorHadir)"
                        name="Hadir"
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="terlambat"
                        stroke="#ca8a04"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTelat)"
                        name="Terlambat"
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AttendanceTrendChart;
