export type OperationResult = "success" | "warning" | "failed";

export interface OperationLog {
  id: string;
  occurredAt: string;
  operator: string;
  module: string;
  action: string;
  result: OperationResult;
  ipAddress: string;
  summary: string;
}

export interface OperationLogQuery {
  operator?: string;
  module?: string;
  action?: string;
  result?: OperationResult;
  keyword?: string;
  occurredAt?: string[];
}

export interface SystemParameter {
  id: string;
  name: string;
  key: string;
  value: string;
  category: string;
  scope: string;
  restartRequired: boolean;
  description: string;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  department: string;
  roles: string[];
  status: "active" | "locked" | "pending";
  lastLogin: string;
}

export interface PermissionItem {
  id: string;
  label: string;
  description: string;
}

export interface RolePermission {
  id: string;
  name: string;
  userCount: number;
  scope: string;
  permissions: string[];
}

export const operationLogs: OperationLog[] = [
  {
    id: "log-20260605-001",
    occurredAt: "2026-06-05 09:31:42",
    operator: "系统管理员",
    module: "认证授权",
    action: "更新角色权限",
    result: "success",
    ipAddress: "10.12.8.21",
    summary: "为数据管理员角色增加数据导出权限",
  },
  {
    id: "log-20260605-002",
    occurredAt: "2026-06-05 09:22:10",
    operator: "数据管理员",
    module: "系统设置",
    action: "保存参数",
    result: "success",
    ipAddress: "10.12.8.44",
    summary: "更新查询结果上限为 30000 条",
  },
  {
    id: "log-20260604-011",
    occurredAt: "2026-06-04 17:48:03",
    operator: "科研用户",
    module: "操作日志",
    action: "导出日志",
    result: "warning",
    ipAddress: "10.12.7.18",
    summary: "导出范围超过 30 天，系统按权限返回最近 30 天记录",
  },
  {
    id: "log-20260604-006",
    occurredAt: "2026-06-04 14:19:26",
    operator: "系统管理员",
    module: "系统设置",
    action: "关闭注册",
    result: "success",
    ipAddress: "10.12.8.21",
    summary: "关闭统一登录页自助注册入口",
  },
  {
    id: "log-20260603-018",
    occurredAt: "2026-06-03 11:07:55",
    operator: "普通用户",
    module: "认证授权",
    action: "登录失败",
    result: "failed",
    ipAddress: "10.12.9.10",
    summary: "密码错误次数达到 3 次，账号进入观察状态",
  },
  {
    id: "log-20260602-014",
    occurredAt: "2026-06-02 16:40:12",
    operator: "数据管理员",
    module: "操作日志",
    action: "查询日志",
    result: "success",
    ipAddress: "10.12.8.44",
    summary: "按模块筛选系统设置操作记录",
  },
];

export const systemParameters: SystemParameter[] = [
  {
    id: "param-system-name",
    name: "系统名称",
    key: "system.name",
    value: "中亚胡杨林生态系统保护数据共享平台",
    category: "基础配置",
    scope: "前台展示",
    restartRequired: false,
    description: "用于浏览器标题、门户页和后台顶部栏展示。",
  },
  {
    id: "param-registration",
    name: "开放注册",
    key: "system.allow_registration",
    value: "false",
    category: "基础配置",
    scope: "认证",
    restartRequired: false,
    description: "控制统一登录页是否展示注册入口。",
  },
  {
    id: "param-query-limit",
    name: "查询结果上限",
    key: "limits.query_result_limit",
    value: "30000",
    category: "参数管理",
    scope: "数据查询",
    restartRequired: false,
    description: "单次查询允许返回的最大记录数。",
  },
  {
    id: "param-raster-timeout",
    name: "栅格脚本超时",
    key: "raster.symbolizer_timeout_seconds",
    value: "120",
    category: "参数管理",
    scope: "栅格出图",
    restartRequired: true,
    description: "统一符号化脚本调用的超时时间，单位秒。",
  },
];

export const adminUsers: AdminUser[] = [
  {
    id: "user-001",
    username: "admin",
    displayName: "系统管理员",
    email: "admin@example.local",
    department: "平台运维组",
    roles: ["系统管理员"],
    status: "active",
    lastLogin: "2026-06-05 09:30",
  },
  {
    id: "user-002",
    username: "data-admin",
    displayName: "数据管理员",
    email: "data-admin@example.local",
    department: "数据资源组",
    roles: ["数据管理员"],
    status: "active",
    lastLogin: "2026-06-05 08:54",
  },
  {
    id: "user-003",
    username: "researcher",
    displayName: "科研用户",
    email: "researcher@example.local",
    department: "生态监测组",
    roles: ["科研用户"],
    status: "active",
    lastLogin: "2026-06-04 18:12",
  },
  {
    id: "user-004",
    username: "normal-user",
    displayName: "普通用户",
    email: "user@example.local",
    department: "项目协作组",
    roles: ["普通用户"],
    status: "locked",
    lastLogin: "2026-06-03 11:08",
  },
];

export const permissions: PermissionItem[] = [
  {
    id: "core.access_admin",
    label: "进入后台管理",
    description: "允许访问新版管理后台和旧版 Django 管理后台入口。",
  },
  {
    id: "core.manage_feature_permissions",
    label: "配置功能权限",
    description: "允许维护用户组与功能权限关系。",
  },
  {
    id: "core.browse_data",
    label: "浏览数据目录",
    description: "允许查看数据目录、图层和成果资料。",
  },
  {
    id: "core.query_data",
    label: "查询数据",
    description: "允许执行属性和空间组合查询。",
  },
  {
    id: "core.export_data",
    label: "导出数据",
    description: "允许导出授权范围内的数据和操作日志。",
  },
  {
    id: "core.maintain_data",
    label: "维护数据",
    description: "允许导入、更新和归档业务数据。",
  },
  {
    id: "core.manage_raster_data",
    label: "管理栅格数据",
    description: "允许维护栅格数据集、脚本和默认符号化规则。",
  },
];

export const rolePermissions: RolePermission[] = [
  {
    id: "role-system-admin",
    name: "系统管理员",
    userCount: 1,
    scope: "系统维护、权限配置、日志审计",
    permissions: [
      "core.access_admin",
      "core.manage_feature_permissions",
      "core.browse_data",
      "core.query_data",
      "core.export_data",
      "core.maintain_data",
      "core.manage_raster_data",
    ],
  },
  {
    id: "role-data-admin",
    name: "数据管理员",
    userCount: 1,
    scope: "数据维护、图层配置、成果管理",
    permissions: [
      "core.access_admin",
      "core.browse_data",
      "core.query_data",
      "core.export_data",
      "core.maintain_data",
      "core.manage_raster_data",
    ],
  },
  {
    id: "role-researcher",
    name: "科研用户",
    userCount: 1,
    scope: "数据浏览、查询和授权导出",
    permissions: ["core.browse_data", "core.query_data", "core.export_data"],
  },
  {
    id: "role-normal",
    name: "普通用户",
    userCount: 1,
    scope: "基础浏览和地图查看",
    permissions: ["core.browse_data"],
  },
];

export function filterOperationLogs(query: OperationLogQuery) {
  const keyword = normalize(query.keyword);
  const operator = normalize(query.operator);
  const module = query.module;
  const action = normalize(query.action);
  const result = query.result;
  const [startTime, endTime] = query.occurredAt ?? [];

  return operationLogs.filter((log) => {
    if (operator && !normalize(log.operator).includes(operator)) {
      return false;
    }
    if (module && log.module !== module) {
      return false;
    }
    if (action && !normalize(log.action).includes(action)) {
      return false;
    }
    if (result && log.result !== result) {
      return false;
    }
    if (
      keyword &&
      !normalize(`${log.operator} ${log.action} ${log.summary}`).includes(
        keyword,
      )
    ) {
      return false;
    }
    if (startTime && log.occurredAt < startTime) {
      return false;
    }
    if (endTime && log.occurredAt > endTime) {
      return false;
    }
    return true;
  });
}

export function operationLogsToCsv(rows: OperationLog[]) {
  const headers = [
    "时间",
    "操作用户",
    "模块",
    "动作",
    "结果",
    "IP 地址",
    "摘要",
  ];
  const body = rows.map((row) =>
    [
      row.occurredAt,
      row.operator,
      row.module,
      row.action,
      row.result,
      row.ipAddress,
      row.summary,
    ].map(escapeCsvCell),
  );
  return [headers, ...body].map((line) => line.join(",")).join("\n");
}

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function escapeCsvCell(value: string) {
  if (/["\n,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
