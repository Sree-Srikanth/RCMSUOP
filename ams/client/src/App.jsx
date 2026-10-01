import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth, HOME_BY_ROLE } from './lib/auth';
import { Spinner } from './components/ui';
import Layout from './components/Layout';

import PublicHome from './pages/public/PublicHome';
import VacancyDetail from './pages/public/VacancyDetail';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import { ForgotPassword, ResetPassword } from './pages/public/PasswordReset';
import ChangePassword from './pages/public/ChangePassword';
import RefereeForm from './pages/public/RefereeForm';
import NotFound from './pages/public/NotFound';

import ApplicantDashboard from './pages/applicant/Dashboard';
import Profile from './pages/applicant/Profile';
import ApplicantVacancies from './pages/applicant/Vacancies';
import MyApplications from './pages/applicant/MyApplications';
import ApplicationWizard from './pages/applicant/ApplicationWizard';
import ViewMyApplication from './pages/applicant/ViewMyApplication';
import Notifications from './pages/shared/Notifications';

import RegistrarDashboard from './pages/registrar/Dashboard';
import ApplicationsList from './pages/registrar/ApplicationsList';
import ReviewApplication from './pages/registrar/ReviewApplication';
import Shortlist from './pages/registrar/Shortlist';
import Interviews from './pages/registrar/Interviews';
import InterviewDetail from './pages/registrar/InterviewDetail';
import Appointments from './pages/registrar/Appointments';
import Reports from './pages/registrar/Reports';
import VacanciesAdmin from './pages/registrar/VacanciesAdmin';
import VacancyForm from './pages/registrar/VacancyForm';

import SharedApplications from './pages/shared/SharedApplications';
import SharedApplicationView from './pages/shared/SharedApplicationView';

import AdminDashboard from './pages/admin/Dashboard';
import UsersAdmin from './pages/admin/Users';
import MasterData from './pages/admin/MasterData';
import SettingsAdmin from './pages/admin/Settings';
import AuditLog from './pages/admin/AuditLog';
import Outbox from './pages/admin/Outbox';

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.must_change_password) return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role] || '/'} replace />;
  return children;
}

const STAFF = ['REGISTRAR', 'ADMIN'];

export default function App() {
  const { user } = useAuth();
  if (user === undefined) return <Spinner label="Starting…" />;

  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/vacancies/:id" element={<VacancyDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/referee" element={<RefereeForm />} />
      <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" replace />} />

      <Route element={<RequireRole><Layout /></RequireRole>}>
        <Route path="/notifications" element={<Notifications />} />

        <Route path="/applicant" element={<RequireRole roles={['APPLICANT']}><ApplicantDashboard /></RequireRole>} />
        <Route path="/applicant/profile" element={<RequireRole roles={['APPLICANT']}><Profile /></RequireRole>} />
        <Route path="/applicant/vacancies" element={<RequireRole roles={['APPLICANT']}><ApplicantVacancies /></RequireRole>} />
        <Route path="/applicant/applications" element={<RequireRole roles={['APPLICANT']}><MyApplications /></RequireRole>} />
        <Route path="/applicant/applications/:id/edit" element={<RequireRole roles={['APPLICANT']}><ApplicationWizard /></RequireRole>} />
        <Route path="/applicant/applications/:id" element={<RequireRole roles={['APPLICANT']}><ViewMyApplication /></RequireRole>} />

        <Route path="/registrar" element={<RequireRole roles={['REGISTRAR']}><RegistrarDashboard /></RequireRole>} />
        <Route path="/registrar/applications" element={<RequireRole roles={STAFF}><ApplicationsList /></RequireRole>} />
        <Route path="/registrar/applications/:id" element={<RequireRole roles={STAFF}><ReviewApplication /></RequireRole>} />
        <Route path="/registrar/shortlist" element={<RequireRole roles={STAFF}><Shortlist /></RequireRole>} />
        <Route path="/registrar/interviews" element={<RequireRole roles={STAFF}><Interviews /></RequireRole>} />
        <Route path="/registrar/interviews/:id" element={<RequireRole roles={STAFF}><InterviewDetail /></RequireRole>} />
        <Route path="/registrar/appointments" element={<RequireRole roles={STAFF}><Appointments /></RequireRole>} />
        <Route path="/registrar/reports" element={<RequireRole roles={STAFF}><Reports /></RequireRole>} />
        <Route path="/vacancies-admin" element={<RequireRole roles={STAFF}><VacanciesAdmin /></RequireRole>} />
        <Route path="/vacancies-admin/new" element={<RequireRole roles={STAFF}><VacancyForm /></RequireRole>} />
        <Route path="/vacancies-admin/:id" element={<RequireRole roles={STAFF}><VacancyForm /></RequireRole>} />

        <Route path="/shared" element={<RequireRole roles={['HOD', 'DEAN']}><SharedApplications /></RequireRole>} />
        <Route path="/shared/applications/:id" element={<RequireRole roles={['HOD', 'DEAN']}><SharedApplicationView /></RequireRole>} />

        <Route path="/admin" element={<RequireRole roles={['ADMIN']}><AdminDashboard /></RequireRole>} />
        <Route path="/admin/users" element={<RequireRole roles={['ADMIN']}><UsersAdmin /></RequireRole>} />
        <Route path="/admin/master-data" element={<RequireRole roles={['ADMIN']}><MasterData /></RequireRole>} />
        <Route path="/admin/settings" element={<RequireRole roles={['ADMIN']}><SettingsAdmin /></RequireRole>} />
        <Route path="/admin/audit" element={<RequireRole roles={['ADMIN']}><AuditLog /></RequireRole>} />
        <Route path="/admin/outbox" element={<RequireRole roles={['ADMIN']}><Outbox /></RequireRole>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
