import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Admin = () => {
  const { profile, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">Manage rooms, seasons, and submissions</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default Admin;
