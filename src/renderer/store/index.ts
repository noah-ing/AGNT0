import { configureStore } from '@reduxjs/toolkit';
import workflowReducer from './workflowSlice';
import editorReducer from './editorSlice';
import executionReducer from './executionSlice';
import configReducer from './configSlice';

export const store = configureStore({
  reducer: {
    workflow: workflowReducer,
    editor: editorReducer,
    execution: executionReducer,
    config: configReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
