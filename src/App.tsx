import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import TempsPage from "@/pages/Temps";
import SitesPage from "@/pages/Sites";
import AppsPage from "@/pages/Apps";
import RapportsPage from "@/pages/Rapports";
import ProfilsPage from "@/pages/Profils";
import ParametresPage from "@/pages/Parametres";
import { ChoixProfilScreen, KidScreen } from "@/pages/KidMode";
import "@/index.css";

function AppRoutes() {
  const { screen } = useAuth();

  if (screen === "login")  return <LoginPage />;
  if (screen === "kid")    return <KidScreen />;

  // Pas d'écran choix_profil séparé — on va directement en kid
  return (
    <Routes>
      <Route path="/dashboard"  element={<DashboardPage />} />
      <Route path="/temps"      element={<TempsPage />} />
      <Route path="/sites"      element={<SitesPage />} />
      <Route path="/apps"       element={<AppsPage />} />
      <Route path="/rapports"   element={<RapportsPage />} />
      <Route path="/profils"    element={<ProfilsPage />} />
      <Route path="/parametres" element={<ParametresPage />} />
      <Route path="*"           element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
