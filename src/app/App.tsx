import { RouterProvider } from 'react-router';
import { router } from './routes';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClientProvider } from './contexts/ClientContext';
import { FilterProvider } from './contexts/FilterContext';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { SnackbarHost } from './components/Snackbar';

export default function App() {
  return (
    <LanguageProvider>
      <ClientProvider>
        <FilterProvider>
          <WorkflowProvider>
            <RouterProvider router={router} />
            <SnackbarHost />
          </WorkflowProvider>
        </FilterProvider>
      </ClientProvider>
    </LanguageProvider>
  );
}
