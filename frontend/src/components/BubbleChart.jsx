import { useMemo } from "react";
import * as d3 from "d3";

const MARGIN = { top: 20, right: 20, bottom: 40, left: 60 };
const BUBBLE_MIN_SIZE = 4;
const BUBBLE_MAX_SIZE = 50;

export const BubbleChart = ({ width = 700, height = 500, data = [] }) => {
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // Scales
  const { xScale, yScale, sizeScale, colorScale } = useMemo(() => {
    const xExtent = d3.extent(data, (d) => d.volume);
    const yExtent = d3.extent(data, (d) => d.marketCap);
    const sizeExtent = d3.extent(data, (d) => d.size);

    const xScale = d3
      .scaleLog()
      .domain([Math.max(1, xExtent[0]), xExtent[1]])
      .range([10, boundsWidth - 10])
      .nice();

    const yScale = d3
      .scaleLog()
      .domain([Math.max(1, yExtent[0]), yExtent[1]])
      .range([boundsHeight - 10, 10])
      .nice();

    const sizeScale = d3
      .scaleSqrt()
      .domain(sizeExtent)
      .range([BUBBLE_MIN_SIZE, BUBBLE_MAX_SIZE]);

    const colorScale = d3
      .scaleLinear()
      .domain([-10, 0, 10])
      .range(["#ef4444", "#64748b", "#22c55e"])
      .clamp(true);

    return { xScale, yScale, sizeScale, colorScale };
  }, [data, boundsWidth, boundsHeight]);

  // Build the bubbles (sorted so big bubbles are behind)
  const allBubbles = useMemo(() => {
    return [...data]
      .sort((a, b) => b.size - a.size)
      .map((d, i) => {
        return (
          <g key={i}>
            <circle
              cx={xScale(d.volume)}
              cy={yScale(d.marketCap)}
              r={sizeScale(d.size)}
              fill={colorScale(d.change)}
              fillOpacity={0.7}
              stroke="white"
              strokeWidth={1}
            />
            {sizeScale(d.size) > 15 && (
              <text
                x={xScale(d.volume)}
                y={yScale(d.marketCap)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.min(sizeScale(d.size) / 3, 12)}
                fill="white"
                fontWeight="bold"
                pointerEvents="none"
              >
                {d.name}
              </text>
            )}
          </g>
        );
      });
  }, [data, xScale, yScale, sizeScale, colorScale]);

  // Axes
  const xAxisTicks = useMemo(() => {
    return xScale.ticks(5).map((value) => ({
      value,
      xOffset: xScale(value),
    }));
  }, [xScale]);

  const yAxisTicks = useMemo(() => {
    return yScale.ticks(5).map((value) => ({
      value,
      yOffset: yScale(value),
    }));
  }, [yScale]);

  return (
    <div>
      <svg width={width} height={height}>
        <g
          width={boundsWidth}
          height={boundsHeight}
          transform={`translate(${MARGIN.left},${MARGIN.top})`}
        >
          {/* Y axis */}
          <g>
            {yAxisTicks.map(({ value, yOffset }) => (
              <g key={value} transform={`translate(0, ${yOffset})`}>
                <line
                  x1={0}
                  x2={boundsWidth}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
                <text
                  x={-10}
                  y={0}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.6}
                >
                  ${(value / 1e9).toFixed(0)}B
                </text>
              </g>
            ))}
            <text
              x={-40}
              y={boundsHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, -40, ${boundsHeight / 2})`}
              fontSize={12}
              fill="currentColor"
              opacity={0.8}
            >
              Market Cap
            </text>
          </g>

          {/* X axis */}
          <g>
            {xAxisTicks.map(({ value, xOffset }) => (
              <g key={value} transform={`translate(${xOffset}, 0)`}>
                <line
                  y1={0}
                  y2={boundsHeight}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
                <text
                  y={boundsHeight + 20}
                  textAnchor="middle"
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.6}
                >
                  ${(value / 1e9).toFixed(0)}B
                </text>
              </g>
            ))}
            <text
              x={boundsWidth / 2}
              y={boundsHeight + 35}
              textAnchor="middle"
              fontSize={12}
              fill="currentColor"
              opacity={0.8}
            >
              24h Volume
            </text>
          </g>

          {/* Bubbles */}
          {allBubbles}
        </g>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-muted-foreground">Negative 24h</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-500"></div>
          <span className="text-muted-foreground">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-muted-foreground">Positive 24h</span>
        </div>
      </div>
    </div>
  );
};
