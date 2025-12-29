import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from './components/Layout';
import { useRuntimeEvents } from './hooks/useRuntimeEvents';
import { loadWorkflows, createWorkflow } from './store/workflowSlice';
import { loadConfig } from './store/configSlice';
import type { AppDispatch, RootState } from './store';

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentWorkflow = useSelector((state: RootState) => state.workflow.currentWorkflow);
  const workflows = useSelector((state: RootState) => state.workflow.workflows);
  const isLoading = useSelector((state: RootState) => state.workflow.isLoading);

  // Set up runtime event listeners
  useRuntimeEvents();

  // Load initial data
  useEffect(() => {
    dispatch(loadWorkflows());
    dispatch(loadConfig());
  }, [dispatch]);

  // Auto-create a default workflow if none exists
  useEffect(() => {
    if (!isLoading && workflows.length === 0 && !currentWorkflow) {
      dispatch(createWorkflow({ name: 'Untitled Workflow' }));
    }
  }, [isLoading, workflows.length, currentWorkflow, dispatch]);

  return <Layout />;
};

export default App;
