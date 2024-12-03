import React, { useState, useMemo } from 'react';

const LandGrid = ({ onPlotClick }) => {
    const [hoveredPlot, setHoveredPlot] = useState(null);

    // Simplified plot sizes (all perfect squares)
    const plotSizes = [
        { size: 144, color: 'bg-[#FF00FF] hover:bg-[#FF40FF]', price: 400 },    // 12x12
        { size: 100, color: 'bg-[#00FFFF] hover:bg-[#40FFFF]', price: 324 },    // 10x10
        { size: 64, color: 'bg-[#FF0000] hover:bg-[#FF4040]', price: 256 },     // 8x8
        { size: 36, color: 'bg-[#00FF00] hover:bg-[#40FF40]', price: 196 },     // 6x6
        { size: 16, color: 'bg-[#0000FF] hover:bg-[#4040FF]', price: 144 },     // 4x4
        { size: 4, color: 'bg-[#FFFF00] hover:bg-[#FFFF40]', price: 100 }       // 2x2
    ];

    const generatePlots = () => {
        const plots = [];
        let id = 1;
        const gridSize = 60;
        const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));

        const canPlacePlot = (x, y, size) => {
            if (x + size > gridSize || y + size > gridSize) return false;
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    if (grid[y + j][x + i]) return false;
                }
            }
            return true;
        };

        const placePlot = (x, y, size, plotData) => {
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    grid[y + j][x + i] = true;
                }
            }
            plots.push({ id: id++, x, y, w: size, h: size, ...plotData });
        };

        // Fill grid systematically
        for (let y = 0; y < gridSize; y += 2) {
            for (let x = 0; x < gridSize; x += 2) {
                if (!grid[y][x]) {
                    // Try each plot size in random order
                    const shuffledSizes = [...plotSizes]
                        .sort(() => Math.random() - 0.5);

                    for (const plotData of shuffledSizes) {
                        const size = Math.sqrt(plotData.size);
                        if (canPlacePlot(x, y, size)) {
                            placePlot(x, y, size, plotData);
                            break;
                        }
                    }
                }
            }
        }

        return plots;
    };

    const plots = useMemo(() => generatePlots(), []);

    return (
        <div className="w-full overflow-auto p-4 bg-black text-[#00FF00]">
            <div className="relative border-4 border-[#00FF00] p-2" style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(60, minmax(8px, 1fr))',
                gap: '1px',
                width: '1800px',
                backgroundColor: '#000'
            }}>
                {plots.map((plot) => (
                    <div
                        key={plot.id}
                        className={`${plot.color} cursor-pointer transition-colors relative`}
                        style={{
                            gridColumn: `${plot.x + 1} / span ${plot.w}`,
                            gridRow: `${plot.y + 1} / span ${plot.h}`,
                            aspectRatio: '1'
                        }}
                        onClick={() => onPlotClick(plot.id)}
                        onMouseEnter={() => setHoveredPlot(plot.id)}
                        onMouseLeave={() => setHoveredPlot(null)}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs text-black font-bold">{plot.size}</span>
                        </div>
                        
                        {hoveredPlot === plot.id && (
                            <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center">
                                <p className="text-[#00FF00] text-xs">{plot.size} units</p>
                                <p className="text-[#00FF00] text-xs">{plot.price} tokens</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-4 max-w-6xl mx-auto">
                {['PLOTS: ' + plots.length, 
                  'AREA: ' + plots.reduce((sum, p) => sum + p.size, 0),
                  'LARGE: ' + plots.filter(p => p.size >= 100).length
                ].map((stat, i) => (
                    <div key={i} className="border-2 border-[#00FF00] p-4">
                        <p className="text-[#FFFF00]">{stat}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LandGrid;