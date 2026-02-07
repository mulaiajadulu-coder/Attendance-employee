import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const AttendanceSummaryChart = ({ data, compact = false }) => {
    // Default mock data if none provided
    const chartData = data || [
        { name: 'Hadir Tepat Waktu', value: 45, color: '#16a34a' }, // Green-600
        { name: 'Terlambat', value: 12, color: '#ca8a04' }, // Yellow-600
        { name: 'Cuti / Izin', value: 5, color: '#2563eb' }, // Blue-600
        { name: 'Alpha', value: 2, color: '#dc2626' }, // Red-600
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-xs">
                    <p className="font-bold text-gray-900 mb-1">{payload[0].name}</p>
                    <p className="text-gray-500">
                        Jumlah: <span className="font-bold text-gray-900" style={{ color: payload[0].payload.color }}>{payload[0].value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const heightClass = compact ? 'h-[220px]' : 'h-[300px]';
    return (
        <div className={`w-full ${heightClass} bg-white rounded-3xl p-3`}>
            <h3 className="text-xs md:text-sm font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Ringkasan Hari Ini</h3>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value, entry) => <span className="text-xs font-semibold text-gray-600 ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AttendanceSummaryChart;
