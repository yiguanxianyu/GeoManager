import { Navigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";

export default function HomePage() {
  const { user } = useAppContext();
  return <Navigate to={user ? "/map" : "/login"} replace />;
}
