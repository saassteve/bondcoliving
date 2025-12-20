import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  height = 200,
  color = '#6366f1',
  showGrid = true
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value - minValue) / range) * 100;
    return { x, y, value: point.value, label: point.label };
  });

  const pathD = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {showGrid && (
          <g stroke="#374151" strokeWidth="0.1" opacity="0.3">
            <line x1="0" y1="25" x2="100" y2="25" />
            <line x1="0" y1="50" x2="100" y2="50" />
            <line x1="0" y1="75" x2="100" y2="75" />
          </g>
        )}

        {/* Area fill */}
        <path
          d={areaD}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="0.8"
            fill={color}
            className="hover:r-2 transition-all"
          >
            <title>{`${point.label}: ${point.value.toFixed(2)}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

export default SimpleLineChart;
