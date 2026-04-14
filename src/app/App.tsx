import { RouterProvider } from 'react-router';
import { router } from './routes';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClientProvider } from './contexts/ClientContext';
import { FilterProvider } from './contexts/FilterContext';

export default function App() {
  return (
    <LanguageProvider>
      <ClientProvider>
        <FilterProvider>
          <RouterProvider router={router} />
        </FilterProvider>
      </ClientProvider>
    </LanguageProvider>
  );
}
