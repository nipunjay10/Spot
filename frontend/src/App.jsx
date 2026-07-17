import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PartnerSearchPage from "./pages/PartnerSearchPage";
import ProfilePage from "./pages/ProfilePage";
import PactDetailPage from "./pages/PactDetailPage";
import LogWorkoutPage from "./pages/LogWorkoutPage";
import HistoryPage from "./pages/HistoryPage";
import ChallengesPage from "./pages/ChallengesPage";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // on first load, ask the server if we already have a logged-in session
  useEffect(() => {
    async function loadCurrentUser() {
      const res = await fetch("/api/auth/me");
      // only store the user if the session is still valid
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user); // user contains the logged-in user's info (id, username, displayName)
      }
      setLoading(false);
    }

    loadCurrentUser();
  }, []);

  // * This function is passed down to the NavBar and called when the user clicks "Logout".
  async function handleLogout() {
    // tell the server to end the session
    await fetch("/api/auth/logout", { method: "POST" });
    // clear the user locally so the nav updates immediately
    setCurrentUser(null);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          // wrap all the pages in the Layout component so the nav bar is always visible
          element={
            <Layout
              currentUser={currentUser}
              loading={loading}
              onLogout={handleLogout}
            />
          }
        >
          <Route
            path="/login"
            element={<LoginPage onLogin={setCurrentUser} />}
          />
          <Route
            path="/register"
            element={<RegisterPage onRegister={setCurrentUser} />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <PartnerSearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <ProfilePage onAccountDeleted={() => setCurrentUser(null)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacts/:id"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <PactDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <LogWorkoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <ChallengesPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
