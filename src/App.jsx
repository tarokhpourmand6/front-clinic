import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/patients';
import PatientProfile from './pages/PatientProfile';
import PatientList from './pages/PatientList';
import AppointmentForm from './pages/Appointment';
import AppointmentList from './pages/AppointmentList';
import FinancePage from './pages/FinancePage';
import StatsPage from './pages/Statspage';
import OldAppointments from './pages/OldAppointments';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Routes>
          {/* صفحه ورود */}
          <Route path="/login" element={<Login />} />

          {/* مسیرهای محافظت‌شده داخل Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Patients />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients/list"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PatientList />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients/:phone"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PatientProfile />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments/new"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AppointmentForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AppointmentList />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FinancePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <StatsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/old-appointments"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <OldAppointments />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>

        {/* Toast Notification */}
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    </Router>
  );
}

export default App;