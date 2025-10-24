import { Navigate } from "react-router-dom";
import Context from "../context/mainContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, admin } = Context();

  if (role === "user" && !user) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin" && !admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
