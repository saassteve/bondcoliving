import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  height?: number;
  showValues?: boolean;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  height = 300,
  showValues = true
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const color = item.color || '#6366f1';

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col justify-end" style={{ height: '80%' }}>
                <div
                  className="w-full rounded-t transition-all duration-300 hover:opacity-80 relative group"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: color,
                    minHeight: '2px'
                  }}
                >
                  {showValues && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.value.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2 truncate w-full text-center" title={item.label}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleBarChart;
