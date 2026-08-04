'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrafficData {
  timestamp: string;
  count: number;
  avgLatency: number;
}

interface ObservabilityChartProps {
  data: TrafficData[];
}

export default function ObservabilityChart({ data }: ObservabilityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 256 });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // ResizeObserver to calculate dynamic SVG coordinates responsively
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: width || 600,
        height: height || 256,
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height } = dimensions;

  // Chart padding config
  const paddingLeft = 45;
  const paddingRight = 55;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = Math.max(0, width - paddingLeft - paddingRight);
  const chartHeight = Math.max(0, height - paddingTop - paddingBottom);

  if (!data || data.length === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full h-[256px] relative flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100"
      >
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No traffic yet</p>
          <p className="text-[10px] text-slate-400 mt-1">Chart will appear once requests are recorded.</p>
        </div>
      </div>
    );
  }

  const chartData = data;

  // Get raw max and min values
  const counts = chartData.map(d => d.count);
  const latencies = chartData.map(d => d.avgLatency);

  const maxCountRaw = Math.max(...counts);
  const maxCount = maxCountRaw === 0 ? 10 : Math.ceil(maxCountRaw * 1.15 / 5) * 5;

  const maxLatencyRaw = Math.max(...latencies);
  const maxLatency = maxLatencyRaw === 0 ? 100 : Math.ceil(maxLatencyRaw * 1.15 / 50) * 50;

  // Translate data points into exact pixel coordinates inside our SVG viewBox
  const points = chartData.map((d, idx) => {
    const x = paddingLeft + (chartData.length > 1 ? (idx / (chartData.length - 1)) * chartWidth : chartWidth / 2);
    const yCount = paddingTop + chartHeight - (d.count / maxCount) * chartHeight;
    const yLatency = paddingTop + chartHeight - (d.avgLatency / maxLatency) * chartHeight;
    return {
      x,
      yCount,
      yLatency,
      data: d,
    };
  });

  // Smooth Bezier Line Path Generator
  const getLinePath = (yKey: 'yCount' | 'yLatency') => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0][yKey]}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0][yKey]} L ${points[1].x} ${points[1][yKey]}`;

    let path = `M ${points[0].x} ${points[0][yKey]}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      
      // Control points for smooth horizontal interpolation (Monotone cubic spline approximation)
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr[yKey];
      
      const cpX2 = next.x - (next.x - curr.x) / 3;
      const cpY2 = next[yKey];
      
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next[yKey]}`;
    }
    
    return path;
  };

  // SVG Gradient Area Path Generator (using the smooth bezier path)
  const getAreaPath = (yKey: 'yCount' | 'yLatency') => {
    if (points.length === 0) return '';
    const linePath = getLinePath(yKey);
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const bottomY = paddingTop + chartHeight;
    return `${linePath} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;
  };

  const countLinePath = getLinePath('yCount');
  const countAreaPath = getAreaPath('yCount');

  const latencyLinePath = getLinePath('yLatency');
  const latencyAreaPath = getAreaPath('yLatency');

  // Compute horizontal grid lines and Y-axis values
  const gridLines = Array.from({ length: 5 }).map((_, idx) => {
    const ratio = idx / 4;
    const y = paddingTop + ratio * chartHeight;
    const countValue = Math.round(maxCount - ratio * maxCount);
    const latencyValue = Math.round(maxLatency - ratio * maxLatency);
    return { y, countValue, latencyValue };
  });

  // X-Axis tick filters to prevent overlap (max 5 labels)
  const xLabelsCount = Math.min(5, chartData.length);
  const xLabelIndices = Array.from({ length: xLabelsCount }).map((_, idx) => {
    if (xLabelsCount <= 1) return 0;
    return Math.round((idx / (xLabelsCount - 1)) * (chartData.length - 1));
  });

  // Mouse interactivity helpers
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoveredIdx(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[256px] relative select-none"
    >
      <svg
        width="100%"
        height="100%"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="overflow-visible"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Grid Lines and Y-Axis Values */}
        {gridLines.map((line, idx) => (
          <g key={idx} className="transition-all duration-300">
            {/* Horizontal Line */}
            <line
              x1={paddingLeft}
              y1={line.y}
              x2={paddingLeft + chartWidth}
              y2={line.y}
              stroke="#f1f5f9"
              strokeWidth={1}
              strokeDasharray={idx === 4 ? "0" : "4 4"}
            />
            {/* Left Y-Axis Label (Throughput) */}
            <text
              x={paddingLeft - 8}
              y={line.y + 3}
              textAnchor="end"
              fill="#94a3b8"
              fontSize={9}
              className="font-mono font-bold"
            >
              {line.countValue}
            </text>
            {/* Right Y-Axis Label (Latency) */}
            <text
              x={paddingLeft + chartWidth + 8}
              y={line.y + 3}
              textAnchor="start"
              fill="#94a3b8"
              fontSize={9}
              className="font-mono font-bold"
            >
              {line.latencyValue}ms
            </text>
          </g>
        ))}

        {/* X-Axis Timestamps */}
        {xLabelIndices.map((dataIdx) => {
          const p = points[dataIdx];
          if (!p) return null;
          return (
            <text
              key={dataIdx}
              x={p.x}
              y={paddingTop + chartHeight + 18}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={9}
              className="font-semibold tracking-wider uppercase"
            >
              {p.data.timestamp}
            </text>
          );
        })}

        {/* Dynamic Area Paths (Entrance Fade) */}
        <AnimatePresence>
          {points.length > 0 && (
            <>
              {/* Throughput Area */}
              <motion.path
                d={countAreaPath}
                fill="url(#colorCount)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              />

              {/* Latency Area */}
              <motion.path
                d={latencyAreaPath}
                fill="url(#colorLatency)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />

              {/* Throughput Line (Self-Drawing Path) */}
              <motion.path
                d={countLinePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />

              {/* Latency Line (Self-Drawing Path) */}
              <motion.path
                d={latencyLinePath}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Interactive Hover Indicators */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <g>
            {/* Vertical Marker Line */}
            <line
              x1={points[hoveredIdx].x}
              y1={paddingTop}
              x2={points[hoveredIdx].x}
              y2={paddingTop + chartHeight}
              stroke="#cbd5e1"
              strokeWidth={1}
              strokeDasharray="3 3"
            />

            {/* Throughput Highlight Marker */}
            <circle
              cx={points[hoveredIdx].x}
              cy={points[hoveredIdx].yCount}
              r={12}
              fill="#3b82f6"
              fillOpacity={0.15}
              className="transition-all duration-100"
            />
            <circle
              cx={points[hoveredIdx].x}
              cy={points[hoveredIdx].yCount}
              r={5}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth={2}
            />

            {/* Latency Highlight Marker */}
            <circle
              cx={points[hoveredIdx].x}
              cy={points[hoveredIdx].yLatency}
              r={12}
              fill="#6366f1"
              fillOpacity={0.15}
              className="transition-all duration-100"
            />
            <circle
              cx={points[hoveredIdx].x}
              cy={points[hoveredIdx].yLatency}
              r={5}
              fill="#6366f1"
              stroke="#ffffff"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {/* Floating Premium Glassmorphic Tooltip */}
      <AnimatePresence>
        {hoveredIdx !== null && points[hoveredIdx] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-3 rounded-2xl shadow-xl text-xs font-sans text-slate-200"
            style={{
              left: Math.min(width - 170, Math.max(10, points[hoveredIdx].x - 80)),
              top: Math.max(10, Math.min(points[hoveredIdx].yCount, points[hoveredIdx].yLatency) - 75),
            }}
          >
            <div className="font-bold text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-1.5 font-mono">
              Timestamp: {points[hoveredIdx].data.timestamp}
            </div>
            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Throughput:
                </span>
                <span className="font-mono font-black text-slate-100">{points[hoveredIdx].data.count} reqs</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Latency:
                </span>
                <span className="font-mono font-black text-slate-100">{points[hoveredIdx].data.avgLatency} ms</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
