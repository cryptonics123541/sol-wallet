import React, { useState, useMemo, useCallback, useEffect } from 'react';

const LOCAL_STORAGE_KEY = "claimedPlots";
const PLOT_SIZES = [
    { size: 144, color: 'bg-violet-400 hover:bg-violet-500', price: 400 },
    { size: 100, color: 'bg-indigo-400 hover:bg-indigo-500', price: 324 },
    { size: 64, color: 'bg-blue-400 hover:bg-blue-500', price: 256 },
    { size: 36, color: 'bg-sky-400 hover:bg-sky-500', price: 196 },
    { size: 16, color: 'bg-cyan-400 hover:bg-cyan-500', price: 144 },
    { size: 4, color: 'bg-teal-400 hover:bg-teal-500', price: 100 }
];
const GRID_CONFIG = {
    width: 40,
    height: 200,
    maxPlotSize: 144
};

// Function to initialize claimed plots from local storage
const initializeClaimedPlots = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const savedPlots = localStorage.getItem(LOCAL_STORAGE_KEY);
        return savedPlots ? JSON.parse(savedPlots) : {};
    }
    return {};
};

const LandGrid = ({ onPlotClick, burnToken }) => {
    const [hoveredPlot, setHoveredPlot] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [claimedPlots, setClaimedPlots] = useState(initializeClaimedPlots);

    // Track mouse position globally
    const handleMouseMove = useCallback((e) => {
        setMousePosition({
            x: e.clientX,
            y: e.clientY
        });
    }, []);

    // Function to handle when a plot is clicked
    const handlePlotClick = useCallback(async (plot) => {
        if (claimedPlots[plot.id]) {
            const userConfirmed = window.confirm(
                `This plot is already claimed for ${plot.price * 2} tokens. Would you like to buy it from the current owner?`
            );
            if (userConfirmed) {
                const burnSuccess = await burnToken(plot.price * 2);
                if (burnSuccess) {
                    // Update plot ownership
                    setClaimedPlots(prev => {
                        const updatedPlots = { ...prev, [plot.id]: { claimedBy: "currentUser", price: plot.price * 2 } };
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPlots));
                        return updatedPlots;
                    });
                }
            }
        } else {
            const userConfirmed = window.confirm(
                `Would you like to claim this ${plot.size} unit plot for ${plot.price} tokens?`
            );
            if (userConfirmed) {
                const burnSuccess = await burnToken(plot.price);
                if (burnSuccess) {
                    // Mark the plot as claimed
                    setClaimedPlots(prev => {
                        const updatedPlots = { ...prev, [plot.id]: { claimedBy: "currentUser", price: plot.price * 2 } };
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPlots));
                        return updatedPlots;
                    });

                    // Allow user to upload an image for the claimed plot
                    const uploadConfirmed = window.confirm("Plot claimed! Would you like to upload an image for this plot?");
                    if (uploadConfirmed) {
                        // Trigger the image upload process here
                        alert("Image upload functionality will be implemented here.");
                    }

                    onPlotClick(plot);
                }
            }
        }
    }, [claimedPlots, burnToken, onPlotClick]);

    useEffect(() => {
        // Load claimed plots on component mount
        setClaimedPlots(initializeClaimedPlots());
    }, []);

    const generatePlots = useCallback(() => {
        const plots = [];
        let id = 1;
        const grid = Array(GRID_CONFIG.height).fill(null)
            .map(() => Array(GRID_CONFIG.width).fill(false));

        const placePlot = (x, y, size, plotData) => {
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    grid[y + j][x + i] = true;
                }
            }
            plots.push({ id: id++, x, y, w: size, h: size, ...plotData });
        };

        for (let y = 0; y < GRID_CONFIG.height; y += 2) {
            for (let x = 0; x < GRID_CONFIG.width; x += 2) {
                if (!grid[y][x]) {
                    const shuffledSizes = [...PLOT_SIZES]
                        .sort(() => Math.random() - 0.5);

                    for (const plotData of shuffledSizes) {
                        const size = Math.sqrt(plotData.size);
                        if (x + size <= GRID_CONFIG.width && y + size <= GRID_CONFIG.height) {
                            placePlot(x, y, size, plotData);
                            break;
                        }
                    }
                }
            }
        }

        return plots;
    }, []);

    const plots = useMemo(() => generatePlots(), [generatePlots]);

    return (
        <div className="min-h-screen w-full overflow-x-hidden" onMouseMove={handleMouseMove}>
            <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                    className="grid bg-gray-800 border-2 border-gray-800 rounded-lg shadow-lg divide-gray-900"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_CONFIG.width}, minmax(0, 1fr))`,
                        aspectRatio: `${GRID_CONFIG.width} / ${GRID_CONFIG.height}`,
                        width: '100%'
                    }}
                >
                    {plots.map((plot) => (
                        <div
                            key={plot.id}
                            className={`
                                ${plot.color} 
                                transition-all duration-200 
                                relative 
                                border-2 border-gray-800
                                ${claimedPlots[plot.id] ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}
                            `}
                            style={{
                                gridColumn: `span ${plot.w}`,
                                gridRow: `span ${plot.h}`,
                                aspectRatio: '1'
                            }}
                            onClick={() => handlePlotClick(plot)}
                            onMouseEnter={() => setHoveredPlot(plot)}
                            onMouseLeave={() => setHoveredPlot(null)}
                        >
                            <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                                {claimedPlots[plot.id] ? "Claimed" : plot.size}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {hoveredPlot && (
                <div
                    className="fixed z-50 bg-white text-black rounded-lg shadow-lg p-4 pointer-events-none"
                    style={{
                        left: mousePosition.x + 20,
                        top: mousePosition.y + 20,
                        maxWidth: '200px'
                    }}
                >
                    <h3 className="font-bold text-lg">{hoveredPlot.size} Units</h3>
                    <p className="text-sm mt-1">Price: {hoveredPlot.price} tokens</p>
                    <p className="text-xs mt-2 text-gray-700">Click to claim this plot</p>
                </div>
            )}
        </div>
    );
};

export default React.memo(LandGrid);
