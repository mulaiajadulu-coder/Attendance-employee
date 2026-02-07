import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const WorkHoursChart = ({ data, compact = false, showTeam = true }) => {
    const heightClass = compact ? 'h-[250px]' : 'h-[350px]';

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-xs">
                    <p className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="font-semibold mb-1">
                            {entry.name}: {entry.value} Jam
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`w-full ${heightClass} bg-white rounded-3xl p-3`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
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
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '10px' }}
                    />
                    <Bar
                        dataKey="anda"
                        name="Anda"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                        barSize={showTeam ? 20 : 40}
                    />
                    {showTeam && (
                        <Bar
                            dataKey="tim"
                            name="Tim (Rata-rata)"
                            fill="#9333ea"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WorkHoursChart;
