import {
  ApartmentOutlined,
  AppstoreOutlined,
  BookOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  FundProjectionScreenOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  QrcodeOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Empty,
  Input,
  Popover,
  QRCode,
  Space,
  Tag,
  Typography,
} from "antd";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import capfedLogo from "../assets/capfed-logo.png";
import { useAppContext } from "../contexts/AppContext";
import type { Achievement, ResourceListItem, WorkspaceScene } from "../types";
import {
  resourceCategory,
  resourceCategoryName,
  resourceFormatLabel,
  resourceProvider,
} from "../utils/resources";

export type WorkspaceTab = "map" | "nongeo" | "admin";

const platformChineseName = "中亚胡杨林生态系统保护数据共享平台";

interface WorkspaceHeaderProps {
  activeTab: WorkspaceTab;
  canBrowseData: boolean;
  dataPanel?: ReactNode;
  dataPanelOpen?: boolean;
  resources?: ResourceListItem[];
  workspaceScenes?: WorkspaceScene[];
  achievements?: Achievement[];
  searchKeyword?: string;
  onDataPanelOpenChange?: (open: boolean) => void;
  onGlobalSearch?: (keyword: string) => void;
  onQuickLoadResource?: (resource: ResourceListItem) => void;
  onLoadWorkspaceScene?: (scene: WorkspaceScene) => void;
  onOpenAchievement?: (achievement: Achievement) => void;
  onSearchFocus?: () => void;
}

export default function WorkspaceHeader({
  activeTab,
  canBrowseData,
  dataPanel,
  dataPanelOpen,
  resources = [],
  workspaceScenes = [],
  achievements = [],
  searchKeyword = "",
  onDataPanelOpenChange,
  onGlobalSearch,
  onQuickLoadResource,
  onLoadWorkspaceScene,
  onOpenAchievement,
  onSearchFocus,
}: WorkspaceHeaderProps) {
  const { bootstrap, user, setUser } = useAppContext();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setSearchText(searchKeyword);
  }, [searchKeyword]);

  const searchQuery = searchText.trim().toLocaleLowerCase("zh-CN");
  const filteredResources = useMemo(
    () =>
      resources.filter((resource) =>
        searchQuery ? resourceMatches(resource, searchQuery) : true,
      ),
    [resources, searchQuery],
  );
  const filteredWorkspaceScenes = useMemo(
    () =>
      workspaceScenes.filter((scene) =>
        searchQuery ? sceneMatches(scene, searchQuery) : true,
      ),
    [workspaceScenes, searchQuery],
  );
  const filteredAchievements = useMemo(
    () =>
      achievements.filter((achievement) =>
        searchQuery ? achievementMatches(achievement, searchQuery) : true,
      ),
    [achievements, searchQuery],
  );
  const searchCategories = useMemo(
    () => buildSearchCategories(resources, workspaceScenes, achievements),
    [achievements, resources, workspaceScenes],
  );

  async function handleLogout() {
    try {
      await api.logout();
    } catch (error) {
      message.warning(
        error instanceof Error ? error.message : "退出接口异常，本地会话已清空",
      );
    } finally {
      setUser(null);
    }
  }

  function handleSearchTextChange(value: string) {
    setSearchText(value);
    setSearchOpen(true);
    onGlobalSearch?.(value.trim());
  }

  function commitSearch(value: string) {
    const keyword = value.trim();
    const query = keyword ? `?resourceQ=${encodeURIComponent(keyword)}` : "";
    navigate(`/map${query}`);
    onDataPanelOpenChange?.(Boolean(dataPanel));
    onGlobalSearch?.(keyword);
  }

  function handleResourceCenter() {
    if (!canBrowseData) {
      message.warning("当前账号暂无数据资源浏览权限");
      return;
    }
    navigate("/map");
    onDataPanelOpenChange?.(Boolean(dataPanel));
  }

  const dataButton = (
    <button
      type="button"
      className={tabClass(false)}
      onClick={dataPanel ? undefined : handleResourceCenter}
    >
      <FolderOpenOutlined aria-hidden="true" style={{ fontSize: 16 }} />
      <span>资源中心</span>
    </button>
  );

  const wechatContent = (
    <div className="wechat-popover-content">
      <QRCode
        value="https://example.local/capfed-wechat"
        size={136}
        bordered={false}
        color="#173f39"
      />
      <strong>中亚胡杨林数据平台</strong>
      <span>微信公众号二维码示意</span>
    </div>
  );

  const aboutContent = (
    <div className="about-popover-content">
      <strong>{bootstrap.systemName}</strong>
      <span>
        面向胡杨林生态系统保护的数据共享、目录检索与三维地理可视化平台。
      </span>
    </div>
  );

  const userContent = (
    <div className="user-popover-content">
      <div className="user-popover-head">
        <Avatar
          size={42}
          src={user?.avatarUrl || undefined}
          icon={<UserOutlined />}
        />
        <span>
          <strong>{user?.displayName || user?.username || "当前用户"}</strong>
          <small>{user?.username}</small>
        </span>
      </div>
      <div className="user-popover-meta">
        {user?.department && <span>部门：{user.department}</span>}
        {user?.email && <span>邮箱：{user.email}</span>}
      </div>
      <div className="user-popover-actions">
        <Button size="small" onClick={() => navigate("/admin/profile")}>
          个人信息
        </Button>
        <Button size="small" icon={<LogoutOutlined />} onClick={handleLogout}>
          安全退出
        </Button>
      </div>
    </div>
  );

  const searchContent = (
    <section className="workspace-search-results" aria-label="全局搜索结果">
      <SearchResultSection
        title="数据"
        icon={<DatabaseOutlined style={{ fontSize: 15 }} />}
        emptyText="暂无匹配数据"
      >
        {filteredResources.map((resource) => (
          <button
            type="button"
            className="workspace-search-row"
            key={`resource-${resource.id}`}
            onClick={() => {
              navigate(`/map?resourceQ=${encodeURIComponent(resource.name)}`);
              onDataPanelOpenChange?.(Boolean(dataPanel));
              onGlobalSearch?.(resource.name);
            }}
          >
            <span className="workspace-search-row-main">
              <strong>{resource.name}</strong>
              <small>
                {resourceCategoryName(resource) ?? "未分类"} ·{" "}
                {resourceFormatLabel(resource)}
              </small>
            </span>
            <Button
              size="small"
              type="primary"
              ghost
              disabled={!resource.isQueryable && !resource.isRenderable}
              onClick={(event) => {
                event.stopPropagation();
                onQuickLoadResource?.(resource);
              }}
            >
              快速加载
            </Button>
          </button>
        ))}
      </SearchResultSection>

      <SearchResultSection
        title="工程"
        icon={<AppstoreOutlined style={{ fontSize: 15 }} />}
        emptyText="暂无匹配工程或专题"
      >
        {filteredWorkspaceScenes.map((scene) => (
          <button
            type="button"
            className="workspace-search-row"
            key={`scene-${scene.id}`}
            onClick={() => {
              onLoadWorkspaceScene?.(scene);
              setSearchOpen(false);
            }}
          >
            <span className="workspace-search-row-main">
              <strong>{scene.name}</strong>
              <small>{scene.description || formatSceneUpdatedAt(scene)}</small>
            </span>
            <Tag color={scene.kind === "project" ? "blue" : "green"}>
              {scene.kind === "project" ? "工程" : "专题"}
            </Tag>
          </button>
        ))}
      </SearchResultSection>

      <SearchResultSection
        title="成果"
        icon={<FundProjectionScreenOutlined style={{ fontSize: 15 }} />}
        emptyText="暂无匹配成果"
      >
        {filteredAchievements.map((achievement) => (
          <button
            type="button"
            className="workspace-search-row"
            key={`achievement-${achievement.id}`}
            onClick={() => onOpenAchievement?.(achievement)}
          >
            <span className="workspace-search-row-main">
              <strong>{achievement.title}</strong>
              <small>
                {achievement.category?.name ?? "未分类"} ·{" "}
                {achievement.source || achievement.code}
              </small>
            </span>
            <Tag color="purple">成果</Tag>
          </button>
        ))}
      </SearchResultSection>

      <div className="workspace-search-categories">
        <Typography.Text type="secondary">分类</Typography.Text>
        <div>
          {searchCategories.map((category) => (
            <Tag
              key={`${category.kind}-${category.label}`}
              className="workspace-search-category"
              onClick={() => handleSearchTextChange(category.label)}
            >
              {category.label}
            </Tag>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <header className="workspace-header">
      <div className="brand-block">
        <span className="brand-logo-frame">
          <img src={capfedLogo} alt={`${bootstrap.systemName} Logo`} />
        </span>
        <div className="brand-copy">
          <strong>CAPFED</strong>
          <Typography.Title level={4}>{platformChineseName}</Typography.Title>
        </div>
      </div>

      <Popover
        trigger="click"
        placement="bottomLeft"
        open={searchOpen}
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (open) onSearchFocus?.();
        }}
        classNames={{ root: "workspace-search-popover" }}
        content={searchContent}
      >
        <Space.Compact className="workspace-global-search">
          <Input
            className="workspace-global-input"
            allowClear
            prefix={<SearchOutlined style={{ fontSize: 15 }} />}
            value={searchText}
            placeholder="搜索数据、工程、成果"
            onFocus={() => {
              setSearchOpen(true);
              onSearchFocus?.();
            }}
            onChange={(event) => handleSearchTextChange(event.target.value)}
            onPressEnter={(event) => commitSearch(event.currentTarget.value)}
          />
        </Space.Compact>
      </Popover>

      <nav className="header-primary-actions" aria-label="主导航">
        <button
          type="button"
          className={tabClass(false)}
          onClick={() => navigate("/map")}
        >
          <HomeOutlined aria-hidden="true" style={{ fontSize: 16 }} />
          <span>首页</span>
        </button>
        <button
          type="button"
          className={tabClass(activeTab === "map")}
          onClick={() => navigate("/map")}
        >
          <ApartmentOutlined aria-hidden="true" style={{ fontSize: 16 }} />
          <span>地理数据</span>
        </button>
        <button
          type="button"
          className={tabClass(activeTab === "nongeo")}
          onClick={() => navigate("/nongeo")}
        >
          <BookOutlined aria-hidden="true" style={{ fontSize: 16 }} />
          <span>非地理数据</span>
        </button>
        {canBrowseData &&
          (dataPanel ? (
            <Popover
              trigger="click"
              placement="bottomLeft"
              open={dataPanelOpen}
              onOpenChange={onDataPanelOpenChange}
              classNames={{ root: "data-popover" }}
              styles={{
                content: {
                  width: "min(440px, calc(100vw - 32px))",
                  maxHeight: "calc(100vh - 110px)",
                  padding: 0,
                  overflow: "auto",
                  background: "rgba(248, 250, 247, 0.92)",
                  border: "1px solid rgba(255, 255, 255, 0.34)",
                  borderRadius: 8,
                  boxShadow:
                    "0 22px 62px rgba(8, 28, 24, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.38)",
                  backdropFilter: "blur(24px) saturate(1.28)",
                },
              }}
              content={dataPanel}
            >
              {dataButton}
            </Popover>
          ) : (
            dataButton
          ))}
        <button
          type="button"
          className={tabClass(false)}
          onClick={() => message.info("成果目录页面正在接入")}
        >
          <BookOutlined aria-hidden="true" style={{ fontSize: 16 }} />
          <span>成果目录</span>
        </button>
        <button
          type="button"
          className={tabClass(activeTab === "admin")}
          onClick={() => navigate("/admin")}
        >
          <SettingOutlined aria-hidden="true" style={{ fontSize: 16 }} />
          <span>后台管理</span>
        </button>
        <Popover
          trigger="click"
          placement="bottom"
          content={aboutContent}
          overlayClassName="workspace-info-popover"
        >
          <button type="button" className={tabClass(false)}>
            <InfoCircleOutlined aria-hidden="true" style={{ fontSize: 16 }} />
            <span>关于我们</span>
          </button>
        </Popover>
      </nav>

      <div className="header-account-actions">
        <Popover
          trigger="click"
          placement="bottomRight"
          content={wechatContent}
          overlayClassName="workspace-info-popover"
        >
          <Button className="wechat-button" icon={<QrcodeOutlined />}>
            公众号
          </Button>
        </Popover>
        <Popover
          trigger="click"
          placement="bottomRight"
          content={userContent}
          overlayClassName="workspace-info-popover"
        >
          <Button className="user-button">
            <span className="user-button-content">
              <Avatar
                size={24}
                src={user?.avatarUrl || undefined}
                icon={<UserOutlined />}
              />
              <span className="user-button-name">
                {user?.displayName || user?.username || ""}
              </span>
            </span>
          </Button>
        </Popover>
      </div>
    </header>
  );
}

function tabClass(active: boolean) {
  return active
    ? "workspace-switch-card workspace-switch-card-active"
    : "workspace-switch-card";
}

function SearchResultSection({
  title,
  icon,
  emptyText,
  children,
}: {
  title: string;
  icon: ReactNode;
  emptyText: string;
  children: ReactNode[];
}) {
  const items = children.filter(Boolean);
  return (
    <section className="workspace-search-section">
      <div className="workspace-search-section-title">
        <span>
          {icon}
          <Typography.Text strong>{title}</Typography.Text>
        </span>
        <Tag>{items.length}</Tag>
      </div>
      {items.length > 0 ? (
        <div className="workspace-search-list">{items}</div>
      ) : (
        <Empty
          className="workspace-search-empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyText}
        />
      )}
    </section>
  );
}

function resourceMatches(resource: ResourceListItem, query: string) {
  return [
    resource.name,
    resource.code,
    resource.source,
    resourceProvider(resource),
    "description" in resource ? resource.description : "",
    resourceCategoryName(resource),
    resourceFormatLabel(resource),
  ].some((value) => textMatches(value, query));
}

function sceneMatches(scene: WorkspaceScene, query: string) {
  return [
    scene.name,
    scene.description,
    scene.kind === "project" ? "工程" : "专题",
    scene.owner.displayName,
    scene.owner.username,
  ].some((value) => textMatches(value, query));
}

function achievementMatches(achievement: Achievement, query: string) {
  return [
    achievement.title,
    achievement.code,
    achievement.summary,
    achievement.source,
    achievement.category?.name,
  ].some((value) => textMatches(value, query));
}

function textMatches(value: unknown, query: string) {
  return String(value ?? "")
    .toLocaleLowerCase("zh-CN")
    .includes(query);
}

function buildSearchCategories(
  resources: ResourceListItem[],
  workspaceScenes: WorkspaceScene[],
  achievements: Achievement[],
) {
  const categories = new Map<string, { kind: string; label: string }>();
  for (const resource of resources) {
    const category = resourceCategory(resource);
    if (category) {
      categories.set(`data-${category.name}`, {
        kind: "data",
        label: category.name,
      });
    }
  }
  if (workspaceScenes.some((scene) => scene.kind === "project")) {
    categories.set("scene-project", { kind: "scene", label: "工程" });
  }
  if (workspaceScenes.some((scene) => scene.kind === "topic")) {
    categories.set("scene-topic", { kind: "scene", label: "专题" });
  }
  for (const achievement of achievements) {
    const label = achievement.category?.name;
    if (label) {
      categories.set(`achievement-${label}`, { kind: "achievement", label });
    }
  }
  categories.set("achievement-default", { kind: "achievement", label: "成果" });
  return Array.from(categories.values()).slice(0, 18);
}

function formatSceneUpdatedAt(scene: WorkspaceScene) {
  return new Date(scene.updatedAt).toLocaleString("zh-CN", { hour12: false });
}
