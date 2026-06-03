import { Button, Layout, Typography } from "antd";
import { ArrowLeft, Dna, LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { api } from "../api/client";

export default function NonGeoPage() {
  const { bootstrap, user, setUser } = useAppContext();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // 退出接口异常，本地会话已清空
    }
    setUser(null);
  }

  return (
    <Layout className="nongeo-workspace">
      <Layout.Header className="portal-header">
        <div className="header-left">
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate("/")}>
            返回入口
          </Button>
          <div className="brand-block">
            <Dna size={22} />
            <Typography.Title level={4}>
              {bootstrap.systemName} / 非地理可视化
            </Typography.Title>
          </div>
        </div>
        <div className="header-account-actions">
          <Button icon={<ShieldCheck size={16} />} className="user-button">
            {user!.displayName}
          </Button>
          <Button icon={<LogOut size={16} />} onClick={handleLogout}>
            退出
          </Button>
        </div>
      </Layout.Header>
      <main className="nongeo-stage" aria-label="非地理可视化" />
    </Layout>
  );
}
