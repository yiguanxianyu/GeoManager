import { describe, expect, it } from "vitest";
import { filterOperationLogs, operationLogs, operationLogsToCsv } from "./data";

describe("filterOperationLogs", () => {
  it("filters operation logs by module and result", () => {
    const rows = filterOperationLogs({
      module: "系统设置",
      result: "success",
    });

    expect(rows.map((row) => row.id)).toEqual([
      "log-20260605-002",
      "log-20260604-006",
    ]);
  });

  it("filters operation logs by keyword", () => {
    const rows = filterOperationLogs({ keyword: "注册" });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.action).toBe("关闭注册");
  });
});

describe("operationLogsToCsv", () => {
  it("exports a csv document with stable headers", () => {
    const csv = operationLogsToCsv(operationLogs.slice(0, 1));

    expect(csv).toContain("时间,操作用户,模块,动作,结果,IP 地址,摘要");
    expect(csv).toContain("更新角色权限");
  });
});
