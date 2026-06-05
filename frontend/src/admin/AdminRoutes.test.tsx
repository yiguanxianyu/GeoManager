import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { App as AntApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppContext } from "../contexts/AppContext";
import { RequireAdmin } from "../router";
import type { Bootstrap, User } from "../types";
import AdminAuthPage from "./AdminAuthPage";
import AdminLayout from "./AdminLayout";
import AdminOperationLogsPage from "./AdminOperationLogsPage";
import AdminSystemSettingsPage from "./AdminSystemSettingsPage";

const bootstrap: Bootstrap = {
  systemName: "中亚胡杨林生态系统保护数据共享平台",
  allowRegistration: false,
  map: {
    defaultCenter: [87.6, 41.7],
    defaultZoom: 6.5,
    defaultBasemap: "osm",
    mapboxAccessToken: "",
  },
  limits: {
    uploadMaxMb: 512,
    queryResultLimit: 30000,
  },
};

const adminUser: User = {
  id: 1,
  username: "admin",
  displayName: "系统管理员",
  email: "admin@example.local",
  isStaff: true,
  isSuperuser: true,
  roles: ["系统管理员"],
  permissions: {
    canAccessAdmin: true,
    canManageFeaturePermissions: true,
    canBrowseData: true,
    canQueryData: true,
    canLoadVectorLayer: true,
    canLoadRasterLayer: true,
    canUseCustomSymbolization: true,
    canExportData: true,
    canMaintainData: true,
    canManageRasterData: true,
  },
};

function renderAdminRoute(initialEntry: string) {
  return render(
    <AdminTestProviders>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/" element={<div>业务入口</div>} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="logs" replace />} />
              <Route path="logs" element={<AdminOperationLogsPage />} />
              <Route path="settings" element={<AdminSystemSettingsPage />} />
              <Route path="auth" element={<AdminAuthPage />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </AdminTestProviders>,
  );
}

function renderWithProviders(children: React.ReactNode) {
  return render(<AdminTestProviders>{children}</AdminTestProviders>);
}

function AdminTestProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <AppContext.Provider
          value={{
            bootstrap,
            user: adminUser,
            setUser: vi.fn(),
          }}
        >
          {children}
        </AppContext.Provider>
      </AntApp>
    </ConfigProvider>
  );
}

describe("admin routes", () => {
  it("redirects /admin to operation logs", async () => {
    renderAdminRoute("/admin");

    expect(await screen.findByText("日志列表")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /导出日志/ }),
    ).toBeInTheDocument();
  });

  it("navigates from operation logs to system settings", async () => {
    renderAdminRoute("/admin/logs");

    const settingsLinks = await screen.findAllByRole("link", {
      name: /系统设置/,
    });
    fireEvent.click(settingsLinks[0] as HTMLElement);

    expect(await screen.findAllByText("基础配置")).not.toHaveLength(0);
    expect(screen.getByLabelText("系统名称")).toBeInTheDocument();
  });

  it("opens the user detail drawer from auth management", async () => {
    renderWithProviders(<AdminAuthPage />);

    expect(await screen.findByText("用户列表")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "admin" }));

    await waitFor(() => {
      expect(screen.getByText("用户详情")).toBeInTheDocument();
    });
    const drawer = screen.getByRole("dialog", { name: "用户详情" });
    expect(within(drawer).getByText("平台运维组")).toBeInTheDocument();
  }, 15000);
});
