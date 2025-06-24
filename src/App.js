import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import ThemeCustomization from './themes';
import ProjectRoutes from './router';
import ContextProvider from './context/ContextProvider';

import './App.css';

function App() {

  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeCustomization>
      <ContextProvider>
        <ProjectRoutes />
      </ContextProvider>
      </ThemeCustomization>
    </QueryClientProvider>
  );
}

export default App;
