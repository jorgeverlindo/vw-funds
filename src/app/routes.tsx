import { createBrowserRouter, Navigate } from "react-router";
import AppContent from "./AppContent";

export const router = createBrowserRouter([
  { path: "/",                          element: <Navigate to="/OEM/Overview" replace /> },
  { path: "/OEM/:tab",                  Component: AppContent },
  { path: "/:brand/OEM/:tab",           Component: AppContent },
  { path: "/:brand/dealership/:tab",    Component: AppContent },
]);
