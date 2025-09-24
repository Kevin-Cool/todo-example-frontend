import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import RedirectIfAuthenticated from "./routes/RedirectIfAuthenticated";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import type { JSX } from "react";


export default function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>


      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
      </Route>


      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}