import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const WorkHoursCircularChart = ({ current = 0, target = 8 }) => {
    // Ensure current doesn't exceed target for the visual fill, but show real value in text
    const displayValue = Math.min(current, target);
    const remainder = Math.max(0, target - displayValue);

    const data = [
        { name: 'Completed', value: displayValue, color: '#2563eb' },
        { name: 'Remaining', value: remainder, color: '#f3f4f6' }
    ];

    const percentage = Math.round((current / target) * 100);

    return (
        <div className="w-full h-[220px] flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={225}
                        endAngle={-45}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={10} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-3xl font-black text-gray-900 tracking-tighter">
                    {current.toFixed(1)}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Jam Kerja
                </span>
                <div className="mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase">
                    {percentage}% dari target
                </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-between px-10 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>0j</span>
                <span>{target}j</span>
            </div>
        </div>
    );
};

export default WorkHoursCircularChart;
