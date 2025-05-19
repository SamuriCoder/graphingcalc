import '@testing-library/jest-dom';

// Mock WebGL context
const mockWebGLContext = {
  createShader: jest.fn(),
  createProgram: jest.fn(),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getAttribLocation: jest.fn(),
  getUniformLocation: jest.fn(),
  createBuffer: jest.fn(),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  useProgram: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  drawArrays: jest.fn(),
  clear: jest.fn(),
  viewport: jest.fn(),
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockWebGLContext as any);

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}; 