# Ant Design Pro 管理后台实现说明

## 范围

新版管理后台通过前端 `/admin/` 路由承载，使用 `@ant-design/pro-components` 的 `ProLayout`、`PageContainer`、`ProTable`、`ProForm` 和 `ProCard` 实现。当前阶段只实现静态前端能力，不新增后端业务 API，不做前后端联调。

## 路由

- `/admin/`：新版管理后台入口，默认跳转到 `/admin/logs`。
- `/admin/logs`：操作日志，提供本地静态数据的查询、筛选和 CSV 导出。
- `/admin/settings`：系统设置，提供基础配置表单和参数管理表格。
- `/admin/auth`：认证授权，提供用户管理表格和角色权限配置。
- `/admin2/`：旧版 Django Admin，顶部以“旧版管理后台”按钮从新版后台打开。

## 权限

前端路由继续使用登录态和 `user.permissions.canAccessAdmin` 做后台入口保护。旧版 Django Admin 后端路径改为 `/admin2/`，仍由 `core.access_admin` 权限保护。

## 后续接入建议

1. 按 OpenAPI 3.1.0 先补充真实后台 API 定义，再替换当前静态数据源。
2. 操作日志导出可从浏览器 CSV 导出迁移到后端异步导出任务。
3. 系统设置保存应写入 TOML/数据库配置，并返回变更审计日志。
4. 用户与角色权限应复用 Django auth、Group、Permission，不重新发明权限模型。
