import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Backlog from './pages/Backlog';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ArchivedTasks from './pages/ArchivedTasks';
import Users from './pages/Users';
import PlanningPoker from './pages/PlanningPoker';
import Solicitudes from './pages/Solicitudes';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseProgress from './pages/CourseProgress';
import UserStats from './pages/UserStats';
import UserStatsDetail from './pages/UserStatsDetail';
import Holidays from './pages/Holidays';
import GitHubCallback from './pages/GitHubCallback';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/routing/ProtectedRoute';
import AdminRoute from './components/routing/AdminRoute';

// Redirige a /user-stats/:uid del usuario actual
const MyStatsRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/user-stats/${user.uid}`} replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas con MainLayout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/backlog" element={<Backlog />} />
            <Route path="/planning-poker" element={<PlanningPoker />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/archived" element={<ArchivedTasks />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route
              path="/course-progress"
              element={
                <AdminRoute>
                  <CourseProgress />
                </AdminRoute>
              }
            />
            <Route
              path="/solicitudes"
              element={
                <AdminRoute>
                  <Solicitudes />
                </AdminRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
            <Route
              path="/user-stats"
              element={
                <AdminRoute>
                  <UserStats />
                </AdminRoute>
              }
            />
            <Route
              path="/holidays"
              element={
                <AdminRoute>
                  <Holidays />
                </AdminRoute>
              }
            />
            <Route
              path="/user-stats/:userId"
              element={<UserStatsDetail />}
            />
            <Route
              path="/my-stats"
              element={<MyStatsRedirect />}
            />
            <Route path="/github-callback" element={<GitHubCallback />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
