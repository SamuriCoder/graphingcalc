import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setBounds } from '../store/graphSlice';
import { Point, GraphBounds, Equation } from '../types';
import * as math from 'mathjs';

// Helper to find a "nice" step size for grid/ticks
function niceStep(range: number, targetTicks: number) {
  const roughStep = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const magMsd = roughStep / mag;
  let step = mag;
  if (magMsd > 5) step *= 5;
  else if (magMsd > 2) step *= 2;
  return step;
}

// Find intersection points between two functions using sampling and bisection
function findIntersections(
  f1: (x: number) => number | null,
  f2: (x: number) => number | null,
  xMin: number,
  xMax: number,
  samples = 100
): Point[] {
  const points: Point[] = [];
  const step = (xMax - xMin) / samples;
  let prevX = xMin;
  let prevY1 = f1(prevX);
  let prevY2 = f2(prevX);
  for (let i = 1; i <= samples; i++) {
    const x = xMin + i * step;
    const y1 = f1(x);
    const y2 = f2(x);
    if (
      prevY1 !== null && prevY2 !== null &&
      y1 !== null && y2 !== null &&
      (prevY1 - prevY2) * (y1 - y2) < 0
    ) {
      // There is a root in [prevX, x]
      // Use bisection to refine
      let a = prevX, b = x;
      for (let j = 0; j < 10; j++) {
        const mid = (a + b) / 2;
        const fA = f1(a)! - f2(a)!;
        const fMid = f1(mid)! - f2(mid)!;
        if (fA * fMid < 0) b = mid;
        else a = mid;
      }
      const xRoot = (a + b) / 2;
      const yRoot = f1(xRoot);
      if (yRoot !== null && isFinite(yRoot)) {
        points.push({ x: xRoot, y: yRoot });
      }
    }
    prevX = x;
    prevY1 = y1;
    prevY2 = y2;
  }
  return points;
}

function findExtrema(
  f: (x: number) => number | null,
  xMin: number,
  xMax: number,
  samples = 400
): { x: number; y: number; type: 'max' | 'min' }[] {
  const points: { x: number; y: number }[] = [];
  const step = (xMax - xMin) / samples;
  for (let i = 0; i <= samples; i++) {
    const x = xMin + i * step;
    const y = f(x);
    if (y !== null && isFinite(y)) points.push({ x, y });
  }
  const extrema: { x: number; y: number; type: 'max' | 'min' }[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    if (curr.y > prev.y && curr.y > next.y) {
      extrema.push({ x: curr.x, y: curr.y, type: 'max' });
    } else if (curr.y < prev.y && curr.y < next.y) {
      extrema.push({ x: curr.x, y: curr.y, type: 'min' });
    }
  }
  return extrema;
}

function formatCoord(val: number) {
  return Number.isInteger(val) ? val.toString() : val.toFixed(5).replace(/0+$/, '').replace(/\.$/, '');
}

interface GraphProps {
  showIntersections: boolean;
}

const FIXED_EXTREMA_RANGE = { xMin: -20, xMax: 20 };

const Graph: React.FC<GraphProps> = ({ showIntersections }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });
  const [selectedIntersection, setSelectedIntersection] = useState<{ x: number; y: number; sx: number; sy: number } | null>(null);
  const intersectionsRef = useRef<{ x: number; y: number; sx: number; sy: number }[]>([]);
  
  // Extrema state
  const [selectedEquationId, setSelectedEquationId] = useState<string | null>(null);
  // Store extrema per function id
  const extremaCache = useRef<Record<string, { x: number; y: number; type: 'max' | 'min' }[]>>({});
  const [extrema, setExtrema] = useState<{ x: number; y: number; type: 'max' | 'min' }[]>([]);
  const [selectedExtremum, setSelectedExtremum] = useState<{ x: number; y: number; type: 'max' | 'min' } | null>(null);

  const dispatch = useDispatch();
  const { bounds, equations } = useSelector((state: RootState) => state.graph);

  // Recalculate extrema only when the function expression changes
  React.useEffect(() => {
    if (!selectedEquationId) return;
    const eq = equations.find(e => e.id === selectedEquationId);
    if (!eq) return;
    // If already cached for this expression, use it
    const cacheKey = eq.id + ':' + eq.expression;
    if (extremaCache.current[cacheKey]) {
      setExtrema(extremaCache.current[cacheKey]);
      return;
    }
    // Calculate extrema over a fixed range
    let f = (x: number) => {
      try {
        const y = math.evaluate(eq.expression, { x });
        return typeof y === 'number' && isFinite(y) ? y : null;
      } catch {
        return null;
      }
    };
    const { xMin, xMax } = FIXED_EXTREMA_RANGE;
    const rawExtrema = findExtrema(f, xMin, xMax, 1000);
    // Refine extrema using local search (parabolic interpolation)
    const refined = rawExtrema.map(ext => {
      // Use a small window around the extremum
      const h = 1e-2;
      const x0 = ext.x - h, x1 = ext.x, x2 = ext.x + h;
      const y0 = f(x0) ?? ext.y, y1 = ext.y, y2 = f(x2) ?? ext.y;
      // Parabolic interpolation
      const denom = (x0 - x1) * (x0 - x2) * (x1 - x2);
      let xV = ext.x;
      if (denom !== 0) {
        xV = (
          y0 * (x1 * x1 - x2 * x2) +
          y1 * (x2 * x2 - x0 * x0) +
          y2 * (x0 * x0 - x1 * x1)
        ) / (2 * (y0 * (x1 - x2) + y1 * (x2 - x0) + y2 * (x0 - x1)));
      }
      const yV = f(xV) ?? ext.y;
      return { x: xV, y: yV, type: ext.type };
    });
    extremaCache.current[cacheKey] = refined;
    setExtrema(refined);
  }, [selectedEquationId, equations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas and bounds
    const width = canvas.width;
    const height = canvas.height;
    const { xMin, xMax, yMin, yMax } = bounds;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    // Helpers
    const toScreenX = (x: number) => ((x - xMin) / xRange) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / yRange) * height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // --- Draw grid lines and ticks ---
    const xStep = niceStep(xRange, 10);
    const yStep = niceStep(yRange, 10);
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    ctx.font = '12px monospace';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Vertical grid lines and x-axis ticks/labels
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
      // Tick
      ctx.beginPath();
      ctx.moveTo(sx, toScreenY(0) - 5);
      ctx.lineTo(sx, toScreenY(0) + 5);
      ctx.stroke();
      // Label
      if (Math.abs(x) > 1e-8) ctx.fillText(x.toFixed(2).replace(/\.00$/, ''), sx, toScreenY(0) + 7);
    }

    // Horizontal grid lines and y-axis ticks/labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
      // Tick
      ctx.beginPath();
      ctx.moveTo(toScreenX(0) - 5, sy);
      ctx.lineTo(toScreenX(0) + 5, sy);
      ctx.stroke();
      // Label
      if (Math.abs(y) > 1e-8) ctx.fillText(y.toFixed(2).replace(/\.00$/, ''), toScreenX(0) - 7, sy);
    }

    // --- Draw axes (x=0, y=0) ---
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    // y-axis
    if (xMin < 0 && xMax > 0) {
      const sx = toScreenX(0);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }
    // x-axis
    if (yMin < 0 && yMax > 0) {
      const sy = toScreenY(0);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    // --- Draw equations ---
    equations.forEach((equation: Equation) => {
      if (!equation.visible) return;
      ctx.strokeStyle = equation.style.color;
      ctx.lineWidth = equation.style.lineWidth;
      ctx.beginPath();
      const points: Point[] = [];
      for (let x = xMin; x <= xMax; x += xRange / width) {
        try {
          const y = math.evaluate(equation.expression, { x });
          if (typeof y === 'number' && isFinite(y)) {
            points.push({ x, y });
          }
        } catch (error) {
          continue;
        }
      }
      if (points.length > 0) {
        const firstPoint = points[0];
        ctx.moveTo(toScreenX(firstPoint.x), toScreenY(firstPoint.y));
        for (let i = 1; i < points.length; i++) {
          const point = points[i];
          ctx.lineTo(toScreenX(point.x), toScreenY(point.y));
        }
      }
      ctx.stroke();
    });

    // Draw intersection points if enabled
    intersectionsRef.current = [];
    if (showIntersections) {
      const visibleEqs = equations.filter(eq => eq.visible);
      for (let i = 0; i < visibleEqs.length; i++) {
        for (let j = i + 1; j < visibleEqs.length; j++) {
          const eq1 = visibleEqs[i];
          const eq2 = visibleEqs[j];
          let f1: (x: number) => number | null = x => {
            try {
              const y = math.evaluate(eq1.expression, { x });
              return typeof y === 'number' && isFinite(y) ? y : null;
            } catch {
              return null;
            }
          };
          let f2: (x: number) => number | null = x => {
            try {
              const y = math.evaluate(eq2.expression, { x });
              return typeof y === 'number' && isFinite(y) ? y : null;
            } catch {
              return null;
            }
          };
          const intersections = findIntersections(f1, f2, xMin, xMax, 200);
          ctx.fillStyle = '#000';
          intersections.forEach(pt => {
            const sx = toScreenX(pt.x);
            const sy = toScreenY(pt.y);
            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, 2 * Math.PI);
            ctx.fill();
            intersectionsRef.current.push({ x: pt.x, y: pt.y, sx, sy });
          });
        }
      }
    }
    // Draw extrema for selected equation
    if (selectedEquationId && extrema.length > 0) {
      ctx.fillStyle = '#888';
      extrema.forEach(ext => {
        const sx = toScreenX(ext.x);
        const sy = toScreenY(ext.y);
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [equations, bounds, showIntersections, selectedEquationId, extrema]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setSelectedIntersection(null);
    setSelectedExtremum(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;
    const { xMin, xMax, yMin, yMax } = bounds;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    // Convert pixel drag to graph units
    const dxGraph = -dx * (xRange / width);
    const dyGraph = dy * (yRange / height);
    dispatch(setBounds({
      xMin: xMin + dxGraph,
      xMax: xMax + dxGraph,
      yMin: yMin + dyGraph,
      yMax: yMax + dyGraph,
    }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { xMin, xMax, yMin, yMax } = bounds;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    // Graph coords under mouse
    const xGraph = xMin + (mouseX / canvas.width) * xRange;
    const yGraph = yMax - (mouseY / canvas.height) * yRange;
    // Zoom factor
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    // New ranges
    const newXRange = xRange * zoomFactor;
    const newYRange = yRange * zoomFactor;
    // Keep mouse point fixed
    const newXMin = xGraph - ((mouseX / canvas.width) * newXRange);
    const newXMax = newXMin + newXRange;
    const newYMax = yGraph + ((mouseY / canvas.height) * newYRange);
    const newYMin = newYMax - newYRange;
    dispatch(setBounds({
      xMin: newXMin,
      xMax: newXMax,
      yMin: newYMin,
      yMax: newYMax,
    }));
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    // 1. Check extrema dots first
    if (selectedEquationId && extrema.length > 0) {
      const width = canvas.width;
      const height = canvas.height;
      const { xMin, xMax, yMin, yMax } = bounds;
      const xRange = xMax - xMin;
      const yRange = yMax - yMin;
      const toScreenX = (x: number) => ((x - xMin) / xRange) * width;
      const toScreenY = (y: number) => height - ((y - yMin) / yRange) * height;
      const hit = extrema.find(pt => {
        const sx = toScreenX(pt.x);
        const sy = toScreenY(pt.y);
        const dx = sx - mouseX;
        const dy = sy - mouseY;
        return dx * dx + dy * dy < 7 * 7;
      });
      if (hit) {
        setSelectedExtremum(hit);
        return;
      }
    }
    // 2. Check intersection dots
    if (showIntersections) {
      const hit = intersectionsRef.current.find(pt => {
        const dx = pt.sx - mouseX;
        const dy = pt.sy - mouseY;
        return dx * dx + dy * dy < 8 * 8;
      });
      if (hit) {
        setSelectedIntersection(hit);
        setSelectedExtremum(null);
        return;
      }
    }
    // 3. Check if click is near a graph line
    const width = canvas.width;
    const height = canvas.height;
    const { xMin, xMax } = bounds;
    const xRange = xMax - xMin;
    let foundEq: Equation | null = null;
    let foundX = 0;
    let foundY = 0;
    for (const eq of equations) {
      if (!eq.visible) continue;
      for (let px = 0; px < width; px += 4) {
        const x = xMin + (px / width) * xRange;
        let y: number | null = null;
        try {
          const val = math.evaluate(eq.expression, { x });
          if (typeof val === 'number' && isFinite(val)) y = val;
        } catch {}
        if (y !== null) {
          const py = height - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * height;
          if (Math.abs(py - mouseY) < 7 && Math.abs(px - mouseX) < 7) {
            foundEq = eq;
            foundX = x;
            foundY = y;
            break;
          }
        }
      }
      if (foundEq) break;
    }
    if (foundEq) {
      // Find extrema for this equation
      let f = (x: number) => {
        try {
          const y = math.evaluate(foundEq!.expression, { x });
          return typeof y === 'number' && isFinite(y) ? y : null;
        } catch {
          return null;
        }
      };
      const { xMin, xMax } = bounds;
      const extremaPoints = findExtrema(f, xMin, xMax, 400).map(ext => ({
        ...ext,
        sx: ((ext.x - xMin) / (xMax - xMin)) * width,
        sy: height - ((ext.y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * height,
      }));
      setSelectedEquationId(foundEq.id);
      setExtrema(extremaPoints);
      setSelectedExtremum(null);
      setSelectedIntersection(null);
      return;
    }
    // If click elsewhere, clear extrema/intersection selection
    setSelectedEquationId(null);
    setExtrema([]);
    setSelectedExtremum(null);
    setSelectedIntersection(null);
  };

  return (
    <div style={{ position: 'relative', width: 800, height: 600 }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        style={{
          border: '1px solid #ccc',
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          position: 'absolute',
          left: 0,
          top: 0,
        }}
      />
      {selectedIntersection && (
        <div
          className="intersection-label"
          style={{
            position: 'absolute',
            left: selectedIntersection.sx + 10,
            top: selectedIntersection.sy - 10,
          }}
        >
          ({formatCoord(selectedIntersection.x)}, {formatCoord(selectedIntersection.y)})
        </div>
      )}
      {selectedExtremum && (() => {
        const width = 800;
        const height = 600;
        const { xMin, xMax, yMin, yMax } = bounds;
        const xRange = xMax - xMin;
        const yRange = yMax - yMin;
        const sx = ((selectedExtremum.x - xMin) / xRange) * width;
        const sy = height - ((selectedExtremum.y - yMin) / yRange) * height;
        return (
          <div
            className="extrema-label"
            style={{
              position: 'absolute',
              left: sx + 10,
              top: sy - 10,
            }}
          >
            ({formatCoord(selectedExtremum.x)}, {formatCoord(selectedExtremum.y)})
          </div>
        );
      })()}
    </div>
  );
};

export default Graph; 