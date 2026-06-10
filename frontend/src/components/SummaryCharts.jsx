import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const SummaryCharts = ({ charts }) => {
    if (!charts || charts.length === 0) return null;

    return (
        <div className="section-list mb-8">
            <h3 className="text-lg font-bold mb-4">Results Summary by Question</h3>
            <div className="grid grid-cols-2 gap-6">
                {charts.map((chart, index) => (
                    <div key={index} className="card animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="card-header">
                            <h4 className="section-title" title={chart.section_title}>{chart.section_title}</h4>
                            <span className="badge badge-neutral">{chart.total_answers} Responded</span>
                        </div>
                        <div className="card-body" style={{ height: '300px' }}>
                            {chart.options && chart.options.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    {chart.options.length <= 4 ? (
                                        <PieChart>
                                            <Pie
                                                data={chart.options}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="count"
                                                nameKey="option_text"
                                                label
                                            >
                                                {chart.options.map((entry, idx) => (
                                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    ) : (
                                        <BarChart
                                            data={chart.options}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="option_text" 
                                                type="category" 
                                                width={150} 
                                                tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                                                contentStyle={{ 
                                                    borderRadius: '12px', 
                                                    border: '1px solid #e2e8f0', 
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    padding: '10px 14px'
                                                }}
                                                itemStyle={{ fontWeight: 600, fontSize: '13px' }}
                                            />
                                            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                                                {chart.options.map((entry, idx) => (
                                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted">
                                    No data available for this question.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SummaryCharts;
