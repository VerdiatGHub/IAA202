import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster, ToastBar } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoadingPage } from './components/common/Loading';

// Auth Pages
import { LoginPage } from './pages/auth';

// Student Pages
import { StudentDashboard, CourseCatalog, CourseView } from './pages/student';

// Instructor Pages
import { InstructorDashboard, InstructorCourses } from './pages/instructor';

// Admin Pages
import { AdminDashboard, AdminUsers, AdminCourses } from './pages/admin';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage message="Loading your dashboard..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role-based redirect
const RoleRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'instructor':
      return <Navigate to="/instructor" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/student" replace />;
  }
};

// Main App Component
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={<Navigate to="/login" replace />}
      />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Student Routes */}
        <Route path="/student" element={<StudentDashboard userName={user?.fullName} />} />
        <Route path="/student/courses" element={<CourseCatalog />} />
        <Route path="/student/catalog" element={<CourseCatalog />} />
        <Route path="/student/courses/:courseId" element={<CourseView />} />
        <Route path="/student/assignments" element={<div className="page-placeholder">Assignments - Coming Soon</div>} />
        <Route path="/student/quizzes" element={<div className="page-placeholder">Quizzes - Coming Soon</div>} />
        <Route path="/student/progress" element={<div className="page-placeholder">My Progress - Coming Soon</div>} />
        <Route path="/student/ai-chat" element={<div className="page-placeholder">AI Assistant - Coming Soon</div>} />

        {/* Instructor Routes */}
        <Route path="/instructor" element={<InstructorDashboard userName={user?.fullName} />} />
        <Route path="/instructor/courses" element={<InstructorCourses />} />
        <Route path="/instructor/courses/new" element={<div className="page-placeholder">Create Course - Coming Soon</div>} />
        <Route path="/instructor/grading" element={<div className="page-placeholder">Grading - Coming Soon</div>} />
        <Route path="/instructor/students" element={<div className="page-placeholder">Students - Coming Soon</div>} />
        <Route path="/instructor/analytics" element={<div className="page-placeholder">Analytics - Coming Soon</div>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/courses" element={<AdminCourses />} />

        {/* Common Routes */}
        <Route path="/profile" element={<div className="page-placeholder">Profile - Coming Soon</div>} />
        <Route path="/settings" element={<div className="page-placeholder">Settings - Coming Soon</div>} />
      </Route>

      {/* Root redirect based on role */}
      <Route path="/" element={<RoleRedirect />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Placeholder styling (temporary)
const placeholderStyle = `
  .page-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - var(--header-height) - 48px);
    font-size: var(--text-2xl);
    color: var(--text-tertiary);
    padding: var(--space-6);
  }
`;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <style>{placeholderStyle}</style>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              cursor: 'pointer',
            },
          }}
          containerStyle={{
            top: 80,
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <div
                  onClick={() => toast.dismiss(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}
                >
                  {icon}
                  {message}
                </div>
              )}
            </ToastBar>
          )}
        </Toaster>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
