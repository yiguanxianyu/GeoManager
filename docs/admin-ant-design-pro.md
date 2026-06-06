# Ant Design Pro 管理后台实现说明

## 范围

新版管理后台通过前端 `/admin/` 路由承载，使用 `@ant-design/pro-components` 的 `ProLayout`、`PageContainer`、`ProTable`、`ProForm` 和 `ProCard` 实现。数据管理相关功能仍不在新版后台开发范围内。

## 路由

- `/admin/`：新版管理后台入口，默认跳转到 `/admin/profile`。
- `/admin/profile`：用户设置，维护个人信息、修改密码并查看/开关已授予权限。
- `/admin/logs`：操作日志，基于真实审计日志接口提供查询、筛选和 CSV 导出。
- `/admin/settings`：系统设置，只展示用户可配置的 application 设置，保存到 appdata 运行 TOML 配置副本。
- `/admin/auth`：认证授权，提供用户创建、用户列表、用户组分配、用户组增删和功能权限配置。
- `/admin2/`：旧版 Django Admin，顶部以“旧版管理后台”按钮从新版后台打开。

## 权限

前端路由使用登录态和 `user.permissions.canAccessAdmin` 做后台入口保护。旧版 Django Admin 后端路径改为 `/admin2/`，仍由 `core.access_admin` 权限保护。

用户可在“用户设置”中主动关闭或重新开启已经授予的权限；未授予权限不能被写入用户偏好。初始化的 `admin` 完整功能账号不能关闭后台访问权限。管理员通过“认证授权”配置每个用户所属用户组，用户组权限复用 Django `Group`/`Permission`。

用户设置和系统设置默认以只读信息展示，用户点击卡片右上角的小编辑按钮后才进入编辑态。后台创建用户不受自助注册开关影响，但必须具备 `core.create_user` 权限；用户组权限配置必须具备 `core.manage_feature_permissions` 权限。

超级管理员用户组由系统初始化和后端 API 共同保护，不能删除，`core.access_admin` 不可关闭，初始化的 `admin` 用户也不能从该组移除。

## 配置

应用只使用 TOML 配置文件。后端通过 `--config /path/to/app.toml` 参数接收源配置；迁移时复制到业务数据目录的 `config/app.toml`，后台设置只写这份运行副本。`django_secret_key` 自动生成到 `database/.secret_key`，不在配置文件或前端页面中展示。
