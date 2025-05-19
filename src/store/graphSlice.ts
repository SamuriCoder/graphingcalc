import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GraphState, Equation, Point, GraphBounds } from '../types';

const initialState: GraphState = {
  equations: [],
  bounds: {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
  },
  zoom: 1,
  pan: { x: 0, y: 0 },
};

const graphSlice = createSlice({
  name: 'graph',
  initialState,
  reducers: {
    addEquation: (state, action: PayloadAction<Equation>) => {
      state.equations.push(action.payload);
    },
    removeEquation: (state, action: PayloadAction<string>) => {
      state.equations = state.equations.filter(eq => eq.id !== action.payload);
    },
    updateEquation: (state, action: PayloadAction<Equation>) => {
      const index = state.equations.findIndex(eq => eq.id === action.payload.id);
      if (index !== -1) {
        state.equations[index] = action.payload;
      }
    },
    setBounds: (state, action: PayloadAction<GraphBounds>) => {
      state.bounds = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    setPan: (state, action: PayloadAction<Point>) => {
      state.pan = action.payload;
    },
  },
});

export const {
  addEquation,
  removeEquation,
  updateEquation,
  setBounds,
  setZoom,
  setPan,
} = graphSlice.actions;

export default graphSlice.reducer; 