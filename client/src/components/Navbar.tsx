import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Assuming auth context exists

const Navbar = () => {
  const { user } = useContext(AuthContext); // Assuming user object with role

  return (
    <nav className="navbar navbar-expand-lg">
      {/* ...existing code... */}
      {user && user.role === 'employee' && (
        <button className="btn btn-primary ms-2">
          Employee Dashboard
        </button>
      )}
      {/* ...existing code... */}
    </nav>
  );
};

export default Navbar;