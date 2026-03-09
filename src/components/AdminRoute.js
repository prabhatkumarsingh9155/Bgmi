import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { isAdmin, loading } = useAuth();

    if (loading) return null;

    if (!isAdmin) {
        // Redirect to admin login if not an admin
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default AdminRoute;
