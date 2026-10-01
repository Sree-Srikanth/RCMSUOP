import { Link } from 'react-router-dom';
import PublicShell from './PublicShell';
import { EmptyState } from '../../components/ui';

export default function NotFound() {
  return (
    <PublicShell>
      <EmptyState title="Page not found" action={<Link to="/" className="text-uop-700 hover:underline">Go to the home page</Link>}>
        The page you requested does not exist or you do not have access to it.
      </EmptyState>
    </PublicShell>
  );
}
