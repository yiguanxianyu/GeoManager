import {
  DeleteOutlined,
  EditOutlined,
  FileImageOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tooltip,
} from "antd";
import { useCallback, useMemo, useState } from "react";
import { api } from "../api/client";
import type {
  WorkspaceAccessGroup,
  WorkspaceScene,
  WorkspaceSceneKind,
} from "../types";

interface WorkspaceScenePanelProps {
  kind: WorkspaceSceneKind;
  items: WorkspaceScene[];
  accessGroups: WorkspaceAccessGroup[];
  onLoad: (scene: WorkspaceScene) => void | Promise<void>;
  onRefresh: () => unknown | Promise<unknown>;
  onUpdate: (scene: WorkspaceScene) => void;
  onDelete: (sceneId: number) => void;
  onCreateComposition?: (scene: WorkspaceScene) => void | Promise<void>;
}

interface WorkspaceEditValues {
  name: string;
  description?: string;
  accessGroupIds?: number[];
}

export default function WorkspaceScenePanel({
  kind,
  items,
  accessGroups,
  onLoad,
  onRefresh,
  onUpdate,
  onDelete,
  onCreateComposition,
}: WorkspaceScenePanelProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<WorkspaceEditValues>();
  const [loading, setLoading] = useState(false);
  const [loadingSceneId, setLoadingSceneId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [editingScene, setEditingScene] = useState<WorkspaceScene | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const label = kind === "project" ? "工程" : "专题";
  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("zh-CN");
    if (!query) return items;
    return items.filter((scene) =>
      [
        scene.name,
        scene.description,
        scene.owner.displayName,
        scene.owner.username,
        ...scene.accessGroups.map((group) => group.name),
      ].some((value) => value.toLocaleLowerCase("zh-CN").includes(query)),
    );
  }, [items, searchText]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      await onRefresh();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : `${label}加载失败`,
      );
    } finally {
      setLoading(false);
    }
  }, [label, message, onRefresh]);

  async function loadScene(scene: WorkspaceScene) {
    setLoadingSceneId(scene.id);
    try {
      await onLoad(scene);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : `${label}加载失败`,
      );
    } finally {
      setLoadingSceneId(null);
    }
  }

  async function removeScene(scene: WorkspaceScene) {
    try {
      await api.deleteWorkspace(scene.id);
      onDelete(scene.id);
      message.success(`${label}已删除`);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : `${label}删除失败`,
      );
    }
  }

  function openEditScene(scene: WorkspaceScene) {
    setEditingScene(scene);
    form.setFieldsValue({
      name: scene.name,
      description: scene.description,
      accessGroupIds: scene.accessGroups.map((group) => group.id),
    });
  }

  async function submitEditScene() {
    if (!editingScene) return;
    let values: WorkspaceEditValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await api.updateWorkspace(editingScene.id, {
        ...(editingScene.canEdit
          ? {
              name: values.name.trim(),
              description: values.description?.trim() ?? "",
            }
          : {}),
        accessGroupIds: values.accessGroupIds ?? [],
      });
      if ("id" in updated) onUpdate(updated);
      setEditingScene(null);
      message.success(`${label}信息和可见范围已更新`);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : `${label}更新失败`,
      );
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <section className="panel-section topic-workspace-panel">
      <div className="workspace-scene-toolbar">
        <Input
          allowClear
          size="small"
          prefix={<SearchOutlined />}
          placeholder={`搜索${label}、所属用户或共享角色`}
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => void loadItems()}
          loading={loading}
        >
          刷新
        </Button>
      </div>
      <div className="workspace-scene-summary">
        共 {items.length} 个可加载{label}
        {searchText.trim() ? `，匹配 ${filteredItems.length} 个` : ""}
      </div>
      {filteredItems.length === 0 ? (
        <Empty
          className="layer-empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            searchText.trim() ? `没有匹配的${label}` : `暂无可见${label}`
          }
        />
      ) : (
        <div className="topic-scenario-list">
          {filteredItems.map((scene) => (
            <div key={scene.id} className="topic-scenario-row">
              <div className="topic-scenario-main">
                <span>
                  <strong>{scene.name}</strong>
                  <small className="workspace-scene-owner">
                    <UserOutlined />
                    {scene.owner.displayName || scene.owner.username}
                    <Tag color={scene.isOwner ? "cyan" : "blue"}>
                      {scene.isOwner ? "我的" : "共享"}
                    </Tag>
                  </small>
                  <small>{scene.description || "未填写说明"}</small>
                  <small className="workspace-scene-access">
                    <TeamOutlined />
                    {scene.accessGroups.length > 0
                      ? scene.accessGroups.map((group) => group.name).join("、")
                      : "仅所属用户可见"}
                  </small>
                </span>
              </div>
              <Space size={4} wrap>
                <Button
                  type="primary"
                  size="small"
                  loading={loadingSceneId === scene.id}
                  disabled={
                    loadingSceneId !== null && loadingSceneId !== scene.id
                  }
                  onClick={() => void loadScene(scene)}
                >
                  加载
                </Button>
                {kind === "project" && onCreateComposition ? (
                  <Button
                    size="small"
                    icon={<FileImageOutlined style={{ fontSize: 13 }} />}
                    disabled={!scene.isOwner}
                    onClick={() => void onCreateComposition(scene)}
                  >
                    新建出图
                  </Button>
                ) : null}
                {(scene.canEdit || scene.canManageAccess) && (
                  <Tooltip title={`编辑${label}和可见范围`}>
                    <Button
                      aria-label={`编辑${scene.name}`}
                      size="small"
                      icon={<EditOutlined style={{ fontSize: 14 }} />}
                      onClick={() => openEditScene(scene)}
                    />
                  </Tooltip>
                )}
                {scene.canDelete && (
                  <Popconfirm
                    title={`删除${label}`}
                    description={`确认删除“${scene.name}”？`}
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => void removeScene(scene)}
                  >
                    <Button
                      aria-label={`删除${scene.name}`}
                      className="topic-scenario-delete-button"
                      size="small"
                      danger
                      icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                    />
                  </Popconfirm>
                )}
              </Space>
            </div>
          ))}
        </div>
      )}
      <Modal
        title={`编辑${label}`}
        open={Boolean(editingScene)}
        okText="保存"
        cancelText="取消"
        confirmLoading={savingEdit}
        onOk={() => void submitEditScene()}
        onCancel={() => setEditingScene(null)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="name"
            label={`${label}名称`}
            rules={[
              {
                required: true,
                whitespace: true,
                message: `请输入${label}名称`,
              },
              { max: 160, message: `${label}名称不能超过 160 个字符` },
            ]}
          >
            <Input disabled={!editingScene?.canEdit} />
          </Form.Item>
          <Form.Item name="description" label={`${label}说明`}>
            <Input.TextArea
              rows={4}
              maxLength={1000}
              showCount
              disabled={!editingScene?.canEdit}
            />
          </Form.Item>
          <Form.Item name="accessGroupIds" label="额外可见角色">
            <Select
              mode="multiple"
              allowClear
              placeholder="不选择时仅所属用户可见"
              options={accessGroups.map((group) => ({
                value: group.id,
                label: group.name,
              }))}
            />
          </Form.Item>
          <div className="workspace-scene-fixed-access">
            所属用户本人始终可见；平台会自动保留必要的系统访问范围。
          </div>
        </Form>
      </Modal>
    </section>
  );
}
