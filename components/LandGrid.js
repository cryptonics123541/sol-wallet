import React, { useState, useMemo } from 'react';

const LandGrid = ({ onPlotClick }) => {
    const [hoveredPlot, setHoveredPlot] = useState(null);

    const plotSizes = [
        { size: 144, color: 'bg-violet-400 hover:bg-violet-500', price: 400 },
        { size: 100, color: 'bg-indigo-400 hover:bg-indigo-500', price: 324 },
        { size: 64, color: 'bg-blue-400 hover:bg-blue-500', price: 256 },
        { size: 36, color: 'bg-sky-400 hover:bg-sky-500', price: 196 },
        { size: 16, color: 'bg-cyan-400 hover:bg-cyan-500', price: 144 },
        { size: 4, color: 'bg-teal-400 hover:bg-teal-500', price: 100 }
    ];

    // Rest of the generation logic remains the same...
    const generatePlots = () => {
        // ... (keep existing generatePlots code)
    };

    const plots = useMemo(() => generatePlots(), []);

    return (
        <div className="min-h-screen px-4">
            <div className="max-w-[95vw] mx-auto"> {/* Increased from default max-width */}
                <div className="grid gap-0.5 bg-gray-800 border-4 border-gray-900 rounded-lg shadow-lg" 
                    style={{
                        gridTemplateColumns: 'repeat(40, minmax(0, 1fr))',
                        width: '100%'
                    }}>
                    {/* Plot elements remain the same */}
                    {plots.map((plot) => (
                        <div
                            key={plot.id}
                            className={`${plot.color} transition-all duration-200 relative group`}
                            style={{
                                gridColumn: `span ${plot.w}`,
                                gridRow: `span ${plot.h}`,
                                aspectRatio: '1'
                            }}
                            onClick={() => onPlotClick(plot.id)}
                            onMouseEnter={() => setHoveredPlot(plot.id)}
                            onMouseLeave={() => setHoveredPlot(null)}
                        >
                            <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                                {plot.size}
                            </div>
                            
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                                <p className="text-white font-medium">{plot.size} units</p>
                                <p className="text-gray-200 text-sm">{plot.price} tokens</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Stats section with adjusted width to match grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[95vw] mx-auto">
                {[
                    { label: 'Total Plots', value: plots.length },
                    { label: 'Total Area', value: plots.reduce((sum, p) => sum + p.size, 0) },
                    { label: 'Premium Plots', value: plots.filter(p => p.size >= 100).length }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-gray-500 text-sm">{stat.label}</p>
                        <p className="text-gray-900 text-2xl font-semibold mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LandGrid;