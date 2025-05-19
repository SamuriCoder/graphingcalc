import { configureStore } from '@reduxjs/toolkit';
import graphReducer from './graphSlice';
import { GraphState } from '../types';

export const store = configureStore({
  reducer: {
    graph: graphReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = {
  graph: GraphState;
};

export type AppDispatch = typeof store.dispatch; 