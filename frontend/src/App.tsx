import { App as AntApp, Spin } from "antd";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminAuthPage from "./admin/AdminAuthPage";
import AdminLayout from "./admin/AdminLayout";
import AdminOperationLogsPage from "./admin/AdminOperationLogsPage";
import AdminProfilePage from "./admin/AdminProfilePage";
import AdminSystemSettingsPage from "./admin/AdminSystemSettingsPage";
import { ApiError, api } from "./api/client";
import { AppContext } from "./contexts/AppContext";
import HomePage from "./pages/HomePage";
import ImportPage from "./pages/ImportPage";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import NonGeoPage from "./pages/NonGeoPage";
import { RedirectIfAuth, RequireAdmin, RequireAuth } from "./router";
import type { Bootstrap, User } from "./types";

/** 为路由页面添加淡入过渡效果的包装组件 */
function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="route-enter" key={location.pathname}>
      {children}
    </div>
  );
}

export default function App() {
  const { message } = AntApp.useApp();
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        const [bootstrapData] = await Promise.all([
          api.bootstrap(),
          api.csrf(),
        ]);
        let currentUser: User | null = null;
        try {
          const me = await api.me();
          currentUser = me.user;
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 401) {
            throw error;
          }
        }
        if (mounted) {
          setBootstrap(bootstrapData);
          setUser(currentUser);
          document.title = bootstrapData.systemName;
        }
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : "系统初始化失败",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    boot();
    return () => {
      mounted = false;
    };
  }, [message]);

  if (loading || !bootstrap) {
    return (
      <div className="boot-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ bootstrap, user, setUser }}>
      <Routes>
        {/* 已登录用户访问登录页时重定向到首页 */}
        <Route element={<RedirectIfAuth />}>
          <Route
            path="/login"
            element={
              <RouteTransition>
                <LoginPage />
              </RouteTransition>
            }
          />
        </Route>

        {/* 需要登录才能访问的页面 */}
        <Route element={<RequireAuth />}>
          <Route
            path="/"
            element={
              <RouteTransition>
                <HomePage />
              </RouteTransition>
            }
          />
          <Route
            path="/map"
            element={
              <RouteTransition>
                <MapPage />
              </RouteTransition>
            }
          />
          <Route
            path="/nongeo"
            element={
              <RouteTransition>
                <NonGeoPage />
              </RouteTransition>
            }
          />
          <Route
            path="/import"
            element={
              <RouteTransition>
                <ImportPage />
              </RouteTransition>
            }
          />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<AdminProfilePage />} />
              <Route path="logs" element={<AdminOperationLogsPage />} />
              <Route path="settings" element={<AdminSystemSettingsPage />} />
              <Route path="auth" element={<AdminAuthPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AppContext.Provider>
  );
}
