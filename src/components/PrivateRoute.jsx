import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("operationToken");
  return token ? children : <Navigate to="/" />;
};

export default PrivateRoute;