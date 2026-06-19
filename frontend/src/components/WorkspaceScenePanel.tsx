import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
} from "antd";
import { useCallback, useState } from "react";
import { api } from "../api/client";
import type { WorkspaceScene, WorkspaceSceneKind } from "../types";

interface WorkspaceScenePanelProps {
  kind: WorkspaceSceneKind;
  items: WorkspaceScene[];
  onLoad: (scene: WorkspaceScene) => void | Promise<void>;
  onRefresh: () => unknown | Promise<unknown>;
  onUpdate: (scene: WorkspaceScene) => void;
  onDelete: (sceneId: number) => void;
}

export default function WorkspaceScenePanel({
  kind,
  items,
  onLoad,
  onRefresh,
  onUpdate,
  onDelete,
}: WorkspaceScenePanelProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ name: string; description: string }>();
  const [loading, setLoading] = useState(false);
  const [editingScene, setEditingScene] = useState<WorkspaceScene | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const label = kind === "project" ? "工程" : "专题";

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
    });
  }

  async function submitEditScene() {
    if (!editingScene) {
      return;
    }
    let values: { name: string; description?: string };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const name = values.name.trim();
    const description = values.description?.trim() ?? "";
    setSavingEdit(true);
    try {
      const updated = await api.updateWorkspace(editingScene.id, {
        name,
        description,
      });
      if ("id" in updated) {
        onUpdate(updated);
      }
      setEditingScene(null);
      message.success(`${label}已更新`);
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
      <Button size="small" onClick={() => void loadItems()} loading={loading}>
        刷新
      </Button>
      {items.length === 0 ? (
        <Empty
          className="layer-empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`暂无已保存${label}`}
        />
      ) : (
        <div className="topic-scenario-list">
          {items.map((scene) => (
            <div key={scene.id} className="topic-scenario-row">
              <div className="topic-scenario-main">
                <span>
                  <strong>{scene.name}</strong>
                  <small>
                    {scene.description ||
                      new Date(scene.updatedAt).toLocaleString("zh-CN", {
                        hour12: false,
                      })}
                  </small>
                </span>
              </div>
              <Space size={4}>
                <Button size="small" onClick={() => void onLoad(scene)}>
                  加载
                </Button>
                <Button
                  size="small"
                  icon={<EditOutlined style={{ fontSize: 14 }} />}
                  onClick={() => openEditScene(scene)}
                />
                <Popconfirm
                  title={`删除${label}`}
                  description={`确认删除“${scene.name}”？`}
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => void removeScene(scene)}
                >
                  <Button
                    className="topic-scenario-delete-button"
                    size="small"
                    danger
                    icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                  />
                </Popconfirm>
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
            <Input placeholder={`请输入${label}名称`} />
          </Form.Item>
          <Form.Item name="description" label={`${label}说明`}>
            <Input.TextArea
              rows={4}
              maxLength={1000}
              showCount
              placeholder={`请输入${label}说明`}
            />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}
