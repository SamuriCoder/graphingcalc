import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import graphReducer from '../../store/graphSlice';
import Graph from '../Graph';

const createMockStore = () => {
  return configureStore({
    reducer: {
      graph: graphReducer,
    },
  });
};

describe('Graph Component', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
  });

  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <Graph />
      </Provider>
    );

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  it('handles mouse events', () => {
    render(
      <Provider store={store}>
        <Graph />
      </Provider>
    );

    const canvas = screen.getByRole('img');

    // Test mouse down
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    expect(canvas).toHaveStyle({ cursor: 'grabbing' });

    // Test mouse move
    fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
    
    // Test mouse up
    fireEvent.mouseUp(canvas);
    expect(canvas).toHaveStyle({ cursor: 'grab' });
  });

  it('handles wheel events', () => {
    render(
      <Provider store={store}>
        <Graph />
      </Provider>
    );

    const canvas = screen.getByRole('img');
    const initialState = store.getState().graph.zoom;

    // Test zoom in
    fireEvent.wheel(canvas, { deltaY: -100 });
    expect(store.getState().graph.zoom).toBeGreaterThan(initialState);

    // Test zoom out
    fireEvent.wheel(canvas, { deltaY: 100 });
    expect(store.getState().graph.zoom).toBeLessThan(initialState);
  });

  it('handles touch events', () => {
    render(
      <Provider store={store}>
        <Graph />
      </Provider>
    );

    const canvas = screen.getByRole('img');

    // Test touch start
    fireEvent.touchStart(canvas, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ],
    });

    // Test touch move
    fireEvent.touchMove(canvas, {
      touches: [
        { clientX: 150, clientY: 150 },
        { clientX: 250, clientY: 250 },
      ],
    });

    // Test touch end
    fireEvent.touchEnd(canvas);
  });
}); 