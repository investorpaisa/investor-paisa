import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SessionProvider } from "@/contexts/SessionContext";
import "./App.css";

// Pages
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Feed from "@/pages/Feed";
import PostDetail from "@/pages/PostDetail";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Discover from "@/pages/Discover";
import Inbox from "@/pages/Inbox";
import MessagesNew from "@/pages/MessagesNew";
import Notifications from "@/pages/Notifications";
import Markets from "@/pages/Markets";
import StockDetail from "@/pages/StockDetail";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import MainLayout from "@/layouts/MainLayout";

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
                <Route path="/auth" element={<Auth />} />
                
                {/* Legacy auth routes - redirect to new auth */}
                <Route path="/auth/login" element={<Navigate to="/auth" replace />} />
                <Route path="/auth/register" element={<Navigate to="/auth" replace />} />
                
                {/* Feed - accessible to all (anonymous browsing) */}
                <Route path="/feed" element={
                  <MainLayout>
                    <Feed />
                  </MainLayout>
                } />
                
                {/* Post detail - accessible to all */}
                <Route path="/post/:postId" element={
                  <MainLayout>
                    <PostDetail />
                  </MainLayout>
                } />
                
                {/* Protected routes */}
                <Route path="/onboarding" element={
                  <ProtectedRoute>
                    <OnboardingFlow />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/profile/:userId" element={
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                } />
                <Route path="/edit-profile" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <EditProfile />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/discover" element={
                  <MainLayout>
                    <Discover />
                  </MainLayout>
                } />
                <Route path="/inbox" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Inbox />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Inbox />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/messages/new" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <MessagesNew />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Notifications />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/markets" element={
                  <MainLayout>
                    <Markets />
                  </MainLayout>
                } />
                <Route path="/markets/:symbol" element={
                  <MainLayout>
                    <StockDetail />
                  </MainLayout>
                } />
                
                {/* Redirect legacy routes */}
                <Route path="/home" element={<Navigate to="/feed" replace />} />
                <Route path="/professional" element={<Navigate to="/feed" replace />} />
                <Route path="/dashboard" element={<Navigate to="/feed" replace />} />
                <Route path="/circles" element={<Navigate to="/discover" replace />} />
                <Route path="/circle/:circleId" element={<Navigate to="/discover" replace />} />
                <Route path="/network" element={<Navigate to="/discover" replace />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SessionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
