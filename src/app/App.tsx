import { RouterProvider } from 'react-router';
import { router } from './routes';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClientProvider } from './contexts/ClientContext';
import { FilterProvider } from './contexts/FilterContext';
import { WorkflowProvider } from './contexts/WorkflowContext';

export default function App() {
  return (
    <LanguageProvider>
      <ClientProvider>
        <FilterProvider>
          <WorkflowProvider>
            <RouterProvider router={router} />
          </WorkflowProvider>
        </FilterProvider>
      </ClientProvider>
    </LanguageProvider>
  );
}
