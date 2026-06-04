import { createBrowserRouter, Navigate } from "react-router";
import AppContent from "./AppContent";

export const router = createBrowserRouter([
  { path: "/",                                            element: <Navigate to="/OEM/Overview" replace /> },
  { path: "/OEM/:tab",                                    Component: AppContent },
  { path: "/OEM/:tab/:vinSlug",                           Component: AppContent },
  { path: "/:brand/OEM/:tab",                             Component: AppContent },
  { path: "/:brand/OEM/:tab/:vinSlug",                    Component: AppContent },
  { path: "/:brand/dealership/:tab",                      Component: AppContent },
  { path: "/:brand/dealership/:tab/:vinSlug",             Component: AppContent },
  { path: "/:brand/dealership-singular/:tab",             Component: AppContent },
  { path: "/:brand/dealership-singular/:tab/:vinSlug",    Component: AppContent }, // VIN detail deep-link
  { path: "/:brand/dealership-emich/:tab",                Component: AppContent }, // [FV]
  { path: "/:brand/dealership-emich/:tab/:vinSlug",       Component: AppContent }, // [FV]
]);
