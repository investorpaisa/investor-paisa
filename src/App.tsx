import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SessionProvider } from "@/contexts/SessionContext";
import "./App.css";

import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Discover from "@/pages/Discover";
import Inbox from "@/pages/Inbox";
import MessagesNew from "@/pages/MessagesNew";
import Notifications from "@/pages/Notifications";
import Circle from "@/pages/Circle";
import Circles from "@/pages/Circles";
import Feed from "@/pages/Feed";
import Dashboard from "@/pages/Dashboard";
import Markets from "@/pages/Markets";
import StockDetail from "@/pages/StockDetail";
import ProtectedRoute from "@/components/ProtectedRoute";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SessionProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/home" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/onboarding" element={
                  <ProtectedRoute>
                    <OnboardingFlow />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/profile/:userId" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/edit-profile" element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                } />
                <Route path="/discover" element={
                  <ProtectedRoute>
                    <Discover />
                  </ProtectedRoute>
                } />
                <Route path="/feed" element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                } />
                <Route path="/circles" element={
                  <ProtectedRoute>
                    <Circles />
                  </ProtectedRoute>
                } />
                <Route path="/circle/:circleId" element={
                  <ProtectedRoute>
                    <Circle />
                  </ProtectedRoute>
                } />
                <Route path="/inbox" element={
                  <ProtectedRoute>
                    <Inbox />
                  </ProtectedRoute>
                } />
                <Route path="/messages/new" element={
                  <ProtectedRoute>
                    <MessagesNew />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/network" element={
                  <ProtectedRoute>
                    <Circles />
                  </ProtectedRoute>
                } />
                <Route path="/markets" element={
                  <ProtectedRoute>
                    <Markets />
                  </ProtectedRoute>
                } />
                <Route path="/markets/:symbol" element={
                  <ProtectedRoute>
                    <StockDetail />
                  </ProtectedRoute>
                } />
                
                {/* Redirect legacy routes */}
                <Route path="/professional" element={<Navigate to="/home" replace />} />
                
                {/* Redirect to home for any unmatched routes */}
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </SessionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
