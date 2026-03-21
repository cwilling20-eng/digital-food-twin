import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import { UIProvider } from './contexts/UIContext';
import { AuthGate } from './components/AuthGate';
import { AppShell } from './components/AppShell';

import { OnboardingRoute } from './routes/OnboardingRoute';
import { SwipeRoute } from './routes/SwipeRoute';
import { DashboardRoute } from './routes/DashboardRoute';
import { ScannerRoute } from './routes/ScannerRoute';
import { RecommendationsRoute } from './routes/RecommendationsRoute';
import { ChatRoute } from './routes/ChatRoute';
import { DiaryRoute } from './routes/DiaryRoute';
import { NutritionRoute } from './routes/NutritionRoute';
import { HistoryRoute } from './routes/HistoryRoute';
import { ProfileRoute } from './routes/ProfileRoute';
import { FoodDnaRoute } from './routes/FoodDnaRoute';
import { GoalsRoute } from './routes/GoalsRoute';
import { ProgressRoute } from './routes/ProgressRoute';
import { SettingsRoute } from './routes/SettingsRoute';
import { AboutRoute } from './routes/AboutRoute';
import { FriendsRoute } from './routes/FriendsRoute';

function OnboardingRedirect() {
  const { profile } = useProfile();
  if (!profile.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  return <DashboardRoute />;
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <ProfileProvider>
            <UIProvider>
              <Routes>
                <Route element={<AuthGate />}>
                  <Route element={<AppShell />}>
                    <Route index element={<OnboardingRedirect />} />
                    <Route path="/onboarding" element={<OnboardingRoute />} />
                    <Route path="/swipe" element={<SwipeRoute />} />
                    <Route path="/dashboard" element={<DashboardRoute />} />
                    <Route path="/scanner" element={<ScannerRoute />} />
                    <Route path="/recommendations" element={<RecommendationsRoute />} />
                    <Route path="/chat" element={<ChatRoute />} />
                    <Route path="/social" element={<FriendsRoute />} />
                    <Route path="/diary" element={<DiaryRoute />} />
                    <Route path="/nutrition" element={<NutritionRoute />} />
                    <Route path="/history" element={<HistoryRoute />} />
                    <Route path="/profile" element={<ProfileRoute />} />
                    <Route path="/profile/food-dna" element={<FoodDnaRoute />} />
                    <Route path="/profile/goals" element={<GoalsRoute />} />
                    <Route path="/profile/progress" element={<ProgressRoute />} />
                    <Route path="/profile/settings" element={<SettingsRoute />} />
                    <Route path="/profile/about" element={<AboutRoute />} />
                    <Route path="/profile/friends" element={<FriendsRoute />} />
                  </Route>
                </Route>
              </Routes>
            </UIProvider>
          </ProfileProvider>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
