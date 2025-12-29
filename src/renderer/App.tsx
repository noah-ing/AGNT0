import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Layout from './components/Layout';
import { useRuntimeEvents } from './hooks/useRuntimeEvents';
import { loadWorkflows } from './store/workflowSlice';
import { loadConfig } from './store/configSlice';
import type { AppDispatch } from './store';

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Set up runtime event listeners
  useRuntimeEvents();

  // Load initial data
  useEffect(() => {
    dispatch(loadWorkflows());
    dispatch(loadConfig());
  }, [dispatch]);

  return <Layout />;
};

export default App;
