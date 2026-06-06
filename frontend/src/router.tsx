import { Navigate, Outlet } from "react-router-dom";
import { useAppContext } from "./contexts/AppContext";

/** 需要登录才能访问的路由守卫 */
export function RequireAuth() {
  const { user } = useAppContext();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

/** 需要后台权限才能访问的路由守卫 */
export function RequireAdmin() {
  const { user } = useAppContext();
  if (!user?.permissions.canAccessAdmin) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

/** 需要数据维护权限才能访问的后台数据管理路由 */
export function RequireDataMaintain() {
  const { user } = useAppContext();
  if (!user?.permissions.canMaintainData) {
    return <Navigate to="/admin/profile" replace />;
  }
  return <Outlet />;
}

/** 已登录用户访问登录页时重定向到首页 */
export function RedirectIfAuth() {
  const { user } = useAppContext();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
