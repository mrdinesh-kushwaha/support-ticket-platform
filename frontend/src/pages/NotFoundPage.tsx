import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Ticket } from 'lucide-react';

export default function NotFoundPage() {
  const { isAuthenticated, user } = useAuthStore();
  const home = isAuthenticated ? (user?.role === 'CUSTOMER' ? '/dashboard' : '/agent') : '/login';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <Ticket className="h-16 w-16 text-gray-300 mb-4" />
      <h1 className="text-5xl font-bold text-gray-800 mb-2">404</h1>
      <p className="text-lg text-gray-500 mb-6">Page not found</p>
      <Link to={home} className="btn-primary">Go to Dashboard</Link>
    </div>
  );
}
