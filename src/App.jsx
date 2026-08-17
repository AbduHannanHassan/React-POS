import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import PasswordRecovery from "./pages/PasswordRecovery";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ErrorBoundary>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/"                    element={<Dashboard />} />
              <Route path="/sales"               element={<Sales />} />
              <Route path="/inventory"           element={<Inventory />} />
              <Route path="/inventory/categories" element={<Categories />} />
              <Route path="/purchases"           element={<Purchases />} />
              <Route path="/expenses"            element={<Expenses />} />
              <Route path="/suppliers"           element={<Suppliers />} />
              <Route path="/settings"            element={<Settings />} />
            </Route>
            <Route path="/password-recovery" element={<PasswordRecovery />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>
  );
}
