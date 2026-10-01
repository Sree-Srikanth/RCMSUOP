import { Link } from 'react-router-dom';
import { Brand } from '../../components/Layout';
import { useAuth, HOME_BY_ROLE } from '../../lib/auth';

export default function PublicShell({ children, narrow }) {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-uop-700 shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Brand />
          <nav className="flex items-center gap-2 text-sm" aria-label="Account">
            <Link to="/" className="hidden rounded px-3 py-1.5 font-medium text-uop-100 hover:bg-white/10 hover:text-white sm:inline-block">
              Vacancies
            </Link>
            {user ? (
              <Link to={HOME_BY_ROLE[user.role]} className="rounded-md bg-gold-500 px-3 py-1.5 font-semibold text-uop-900 hover:bg-gold-600">
                My dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded px-3 py-1.5 font-medium text-white hover:bg-white/10">
                  Log in
                </Link>
                <Link to="/register" className="rounded-md bg-gold-500 px-3 py-1.5 font-semibold text-uop-900 hover:bg-gold-600">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="main" className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 ${narrow ? 'max-w-md' : 'max-w-6xl'}`}>
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        University of Peradeniya, Peradeniya 20400, Sri Lanka · Academic Establishments Division · acestpera@gs.pdn.ac.lk · 081-2392341
      </footer>
    </div>
  );
}
