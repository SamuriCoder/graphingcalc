// Graph Types
export interface Point {
  x: number;
  y: number;
}

export interface GraphBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface GraphStyle {
  color: string;
  lineWidth: number;
}

// Equation Types
export interface Equation {
  id: string;
  expression: string;
  type: 'explicit' | 'implicit' | 'polar';
  style: GraphStyle;
  visible: boolean;
}

// State Types
export interface GraphState {
  equations: Equation[];
  bounds: GraphBounds;
  zoom: number;
  pan: Point;
}

// Slider Types
export interface Slider {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  linkedEquations: string[]; // IDs of equations that use this slider
}

// Graph Component Types
export interface GraphComponent {
  id: string;
  type: 'equation' | 'slider' | 'point' | 'region';
  properties: Record<string, any>;
  style: GraphStyle;
}

// Worker Message Types
export interface WorkerMessage {
  type: 'compute' | 'sample' | 'analyze';
  payload: any;
}

// Shader Types
export interface ShaderProgram {
  vertexShader: string;
  fragmentShader: string;
  attributes: Record<string, number>;
  uniforms: Record<string, WebGLUniformLocation>;
}

// Touch Gesture Types
export interface TouchGesture {
  type: 'pinch' | 'pan' | 'tap' | 'doubleTap' | 'longPress';
  startPoint: Point;
  endPoint?: Point;
  scale?: number;
  duration: number;
} 