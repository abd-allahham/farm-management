import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { isFirebaseConfigured } from './lib/firebase';
import { AppShell } from './layout/AppShell';
import { YardsPage } from './features/yards/YardsPage';
import { LoginPage } from './routes/LoginPage';
import { NeedsConfigPage } from './routes/NeedsConfigPage';

export default function App() {
  if (!isFirebaseConfigured) {
    return <NeedsConfigPage />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/yards" replace />} />
            <Route path="yards" element={<YardsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
