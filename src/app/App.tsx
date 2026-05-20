import { RouterProvider } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { router } from './routes';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClientProvider } from './contexts/ClientContext';
import { FilterProvider } from './contexts/FilterContext';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { ComplianceProvider } from './contexts/ComplianceContext';
import { SnackbarHost } from './components/Snackbar';

export default function App() {
  return (
    <LanguageProvider>
      <ClientProvider>
        <FilterProvider>
          <WorkflowProvider>
            <ComplianceProvider>
              <RouterProvider router={router} />
              <SnackbarHost />
              <Analytics />
            </ComplianceProvider>
          </WorkflowProvider>
        </FilterProvider>
      </ClientProvider>
    </LanguageProvider>
  );
}
