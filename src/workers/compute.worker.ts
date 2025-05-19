import { WorkerMessage } from '../types';
import * as math from 'mathjs';

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'compute':
      try {
        const result = math.evaluate(payload.expression, payload.variables);
        self.postMessage({ type: 'compute', payload: { result } });
      } catch (error: any) {
        self.postMessage({ type: 'error', payload: { error: error.message } });
      }
      break;

    case 'sample':
      try {
        const points = sampleFunction(payload.expression, payload.bounds, payload.samples);
        self.postMessage({ type: 'sample', payload: { points } });
      } catch (error: any) {
        self.postMessage({ type: 'error', payload: { error: error.message } });
      }
      break;

    case 'analyze':
      try {
        const analysis = analyzeFunction(payload.expression, payload.bounds);
        self.postMessage({ type: 'analyze', payload: { analysis } });
      } catch (error: any) {
        self.postMessage({ type: 'error', payload: { error: error.message } });
      }
      break;
  }
};

function sampleFunction(
  expression: string,
  bounds: { xMin: number; xMax: number },
  samples: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const step = (bounds.xMax - bounds.xMin) / (samples - 1);

  for (let i = 0; i < samples; i++) {
    const x = bounds.xMin + i * step;
    try {
      const y = math.evaluate(expression, { x });
      if (typeof y === 'number' && isFinite(y)) {
        points.push({ x, y });
      }
    } catch (error) {
      // Skip points where the function is undefined
      continue;
    }
  }

  return points;
}

function analyzeFunction(
  expression: string,
  bounds: { xMin: number; xMax: number }
): {
  asymptotes: { x: number }[];
  extrema: { x: number; y: number; type: 'min' | 'max' }[];
} {
  // This is a simplified analysis - in a real implementation,
  // you would use more sophisticated numerical methods
  const asymptotes: { x: number }[] = [];
  const extrema: { x: number; y: number; type: 'min' | 'max' }[] = [];
  const samples = 1000;
  const step = (bounds.xMax - bounds.xMin) / samples;

  let prevY: number | null = null;
  let prevX = bounds.xMin;

  for (let i = 1; i < samples; i++) {
    const x = bounds.xMin + i * step;
    try {
      const y = math.evaluate(expression, { x });
      
      if (typeof y === 'number' && isFinite(y)) {
        // Check for asymptotes
        if (prevY !== null && Math.abs(y - prevY) > 1000) {
          asymptotes.push({ x: (x + prevX) / 2 });
        }

        // Check for extrema
        if (prevY !== null) {
          const nextX = x + step;
          const nextY = math.evaluate(expression, { x: nextX });
          
          if (typeof nextY === 'number' && isFinite(nextY)) {
            if (y > prevY && y > nextY) {
              extrema.push({ x, y, type: 'max' });
            } else if (y < prevY && y < nextY) {
              extrema.push({ x, y, type: 'min' });
            }
          }
        }

        prevY = y;
        prevX = x;
      }
    } catch (error) {
      // Skip points where the function is undefined
      continue;
    }
  }

  return { asymptotes, extrema };
} 