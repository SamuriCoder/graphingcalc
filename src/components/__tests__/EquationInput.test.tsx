import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import graphReducer from '../../store/graphSlice';
import EquationInput from '../EquationInput';

const createMockStore = () => {
  return configureStore({
    reducer: {
      graph: graphReducer,
    },
  });
};

describe('EquationInput Component', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
  });

  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <EquationInput />
      </Provider>
    );

    expect(screen.getByPlaceholderText('Enter equation...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Add Equation');
  });

  it('handles equation type selection', () => {
    render(
      <Provider store={store}>
        <EquationInput />
      </Provider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'implicit' } });
    expect(select).toHaveValue('implicit');
  });

  it('handles equation input', () => {
    render(
      <Provider store={store}>
        <EquationInput />
      </Provider>
    );

    const input = screen.getByPlaceholderText('Enter equation...');
    fireEvent.change(input, { target: { value: 'x^2' } });
    expect(input).toHaveValue('x^2');
  });

  it('handles color selection', () => {
    render(
      <Provider store={store}>
        <EquationInput />
      </Provider>
    );

    const colorInput = screen.getByRole('spinbutton');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    expect(colorInput).toHaveValue('#ff0000');
  });

  it('handles line width input', () => {
    render(
      <Provider store={store}>
        <EquationInput />
      </Provider>
    );

    const widthInput = screen.getByRole('spinbutton');
    fireEvent.change(widthInput, { target: { value: '3' } });
    expect(widthInput).toHaveValue(3);
  });

  it('submits equation to store', () => {
    render(
      <Provider store={store}>
        <EquationInput />
      </Provider>
    );

    const input = screen.getByPlaceholderText('Enter equation...');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'x^2' } });
    fireEvent.click(submitButton);

    const state = store.getState();
    expect(state.graph.equations).toHaveLength(1);
    expect(state.graph.equations[0].expression).toBe('x^2');
  });

  it('clears input after submission', () => {
    render(
      <Provider store={store}>
        <EquationInput />
      </Provider>
    );

    const input = screen.getByPlaceholderText('Enter equation...');
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'x^2' } });
    fireEvent.click(submitButton);

    expect(input).toHaveValue('');
  });
}); 