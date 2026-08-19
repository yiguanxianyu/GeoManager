import {
  ApartmentOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import {
  Alert,
  App as AntApp,
  Button,
  Empty,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { localText, useEnglishLanguage } from "../i18n/useEnglishLanguage";
import type { DataSchemaSummary } from "../types";
import { taxonomyTree } from "../utils/taxonomy";

type CatalogNode = DataSchemaSummary["catalogTree"][number];

const catalogGroupMeta: Record<
  string,
  { sequence: string; shortName: string; tone: string }
> = {
  base_geo: {
    sequence: "01",
    shortName: "空间底座",
    tone: "blue",
  },
  habitat: {
    sequence: "02",
    shortName: "环境本底",
    tone: "green",
  },
  distribution: {
    sequence: "03",
    shortName: "分布证据",
    tone: "cyan",
  },
  thematic: {
    sequence: "04",
    shortName: "专题研究",
    tone: "purple",
  },
};

interface DataSchemaOverviewProps {
  canBrowseData: boolean;
}

export default function DataSchemaOverview({
  canBrowseData,
}: DataSchemaOverviewProps) {
  const { message } = AntApp.useApp();
  const english = useEnglishLanguage();
  const l = (zh: string, en: string) => localText(english, zh, en);
  const [schema, setSchema] = useState<DataSchemaSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSchema = useCallback(async () => {
    if (!canBrowseData) return;
    setLoading(true);
    setError("");
    try {
      setSchema(await api.dataSchemaSummary());
    } catch (nextError) {
      const messageText =
        nextError instanceof Error
          ? nextError.message
          : l("数据分类架构加载失败", "Failed to load the data taxonomy");
      setError(messageText);
      message.error(messageText);
    } finally {
      setLoading(false);
    }
  }, [canBrowseData, english, message]);

  useEffect(() => {
    void loadSchema();
  }, [loadSchema]);

  const catalogGroups = schema ? taxonomyTree(schema) : [];
  const selectableCategories = useMemo(
    () => collectSelectableCategories(catalogGroups),
    [catalogGroups],
  );

  if (!canBrowseData) {
    return (
      <ProCard className="admin-section-card">
        <Alert
          type="info"
          showIcon
          title={l(
            "当前账号暂无平台数据体系浏览权限",
            "This account cannot browse the platform data taxonomy",
          )}
        />
      </ProCard>
    );
  }

  return (
    <ProCard
      className="admin-section-card data-schema-card"
      title={
        <Space>
          <DatabaseOutlined />
          <span>{l("数据体系概览", "Data taxonomy overview")}</span>
        </Space>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => void loadSchema()}
        >
          {l("刷新", "Refresh")}
        </Button>
      }
    >
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          style={{ marginBottom: 16 }}
        />
      )}
      <Spin spinning={loading}>
        {schema ? (
          <div className="data-schema-content">
            <section
              className="data-schema-hero"
              aria-labelledby="schema-title"
            >
              <div className="data-schema-hero-copy">
                <Tag color="success">
                  {l("平台数据分类", "Platform data taxonomy")}
                </Tag>
                <Typography.Title id="schema-title" level={3}>
                  {l(
                    "平台数据分为四个大类和十五个小类",
                    "Platform data is organized into four domains and fifteen categories",
                  )}
                </Typography.Title>
                <Typography.Paragraph>
                  {l(
                    "四个大类概括平台数据覆盖的主要领域，十五个小类进一步说明数据的具体内容。每项数据归入一个小类；暂时无法确定分类的数据统一显示在“未分组（其他）”中。",
                    "The four domains summarize the platform's main subject areas, while fifteen categories describe their contents. Each resource belongs to one category; data awaiting classification appears under Unclassified (Other).",
                  )}
                </Typography.Paragraph>
              </div>
              <div
                className="data-schema-kpis"
                aria-label={l("分类体系关键指标", "Taxonomy key metrics")}
              >
                <SchemaKpi
                  value={catalogGroups.length}
                  unit={l("类", "")}
                  label={l("数据大类", "Domains")}
                />
                <SchemaKpi
                  value={selectableCategories.length}
                  unit={l("类", "")}
                  label={l("数据小类", "Categories")}
                />
                <SchemaKpi
                  value={1}
                  unit={l("组", "")}
                  label={l("未分组数据", "Unclassified group")}
                  warning
                />
              </div>
            </section>

            <section
              className="data-schema-section"
              aria-labelledby="schema-blueprint-title"
            >
              <SectionHeading
                id="schema-blueprint-title"
                icon={<ApartmentOutlined />}
                title={l(
                  "如何查看和使用数据分类",
                  "How to read and use the data taxonomy",
                )}
                description={l(
                  "按照“大类—小类—数据资源”的顺序，快速了解平台有什么数据",
                  "Follow domain → category → resource to quickly understand available platform data",
                )}
              />
              <div className="data-schema-blueprint">
                <BlueprintStep
                  sequence="01"
                  title={l("先看四个大类", "Start with the four domains")}
                  description={l(
                    "了解基础地理、生境、空间分布和专题研究四个主要数据领域",
                    "Review base geography, habitat, spatial distribution, and thematic research",
                  )}
                />
                <BlueprintStep
                  sequence="02"
                  title={l(
                    "再看十五个小类",
                    "Then review the fifteen categories",
                  )}
                  description={l(
                    "根据行政区划、水、土壤、个体、群落、遥感等主题定位数据",
                    "Locate data by administrative boundaries, water, soil, individuals, communities, remote sensing, and other subjects",
                  )}
                />
                <BlueprintStep
                  sequence="03"
                  title={l("展开查看数据", "Expand to inspect resources")}
                  description={l(
                    "在下方分类分组中查看数据数量、规模、状态和具体资源",
                    "Inspect data counts, scale, status, and individual resources in each group below",
                  )}
                />
                <BlueprintStep
                  sequence="04"
                  title={l("关注未分组数据", "Review unclassified data")}
                  description={l(
                    "尚未明确归属的数据仍可查看，并会在分类确认后归入相应小类",
                    "Data without a confirmed category remains visible and will move to the appropriate category after review",
                  )}
                />
              </div>
            </section>

            <section
              className="data-schema-section"
              aria-labelledby="schema-taxonomy-title"
            >
              <SectionHeading
                id="schema-taxonomy-title"
                icon={<DatabaseOutlined />}
                title={l("平台数据分类一览", "Platform taxonomy at a glance")}
                description={l(
                  "每个大类下列出具体小类及其包含的数据内容",
                  "Each domain lists its categories and the data they contain",
                )}
              />
              <div className="data-schema-category-grid">
                {catalogGroups.map((group, index) => (
                  <CatalogGroup key={group.code} group={group} index={index} />
                ))}
              </div>
            </section>

            <UnclassifiedDataNote />
          </div>
        ) : (
          <Empty
            description={l(
              "暂无平台数据体系信息",
              "No platform taxonomy information",
            )}
          />
        )}
      </Spin>
    </ProCard>
  );
}

function SchemaKpi({
  value,
  unit,
  label,
  warning = false,
}: {
  value: number;
  unit: string;
  label: string;
  warning?: boolean;
}) {
  return (
    <div
      className={`data-schema-kpi${warning ? " data-schema-kpi--warning" : ""}`}
    >
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
      <span>{label}</span>
    </div>
  );
}

function SectionHeading({
  id,
  icon,
  title,
  description,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="data-schema-section-heading">
      <span className="data-schema-section-icon">{icon}</span>
      <div>
        <Typography.Title id={id} level={4}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">{description}</Typography.Text>
      </div>
    </div>
  );
}

function BlueprintStep({
  sequence,
  title,
  description,
}: {
  sequence: string;
  title: string;
  description: string;
}) {
  return (
    <article className="data-schema-blueprint-step">
      <span>{sequence}</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </article>
  );
}

function CatalogGroup({ group, index }: { group: CatalogNode; index: number }) {
  const english = useEnglishLanguage();
  const categories = collectSelectableCategories([group]);
  const meta = catalogGroupMeta[group.code] ?? {
    sequence: String(index + 1).padStart(2, "0"),
    shortName: english ? "Business category" : "业务分类",
    tone: "default",
  };

  return (
    <article
      className={`data-schema-category data-schema-category--${meta.tone}`}
    >
      <header>
        <span className="data-schema-category-sequence">{meta.sequence}</span>
        <div>
          <Typography.Title level={5}>{group.name}</Typography.Title>
          <Typography.Text>
            {english
              ? ({
                  base_geo: "Spatial foundation",
                  habitat: "Environmental baseline",
                  distribution: "Distribution evidence",
                  thematic: "Thematic research",
                }[group.code] ?? meta.shortName)
              : meta.shortName}
          </Typography.Text>
        </div>
        <Tag>
          {english
            ? `${categories.length} categories`
            : `${categories.length} 个小类`}
        </Tag>
      </header>
      <Typography.Paragraph className="data-schema-category-description">
        {group.description}
      </Typography.Paragraph>
      <div className="data-schema-leaf-list">
        {categories.map((category, categoryIndex) => (
          <div className="data-schema-leaf" key={category.categoryCode}>
            <span>{String(categoryIndex + 1).padStart(2, "0")}</span>
            <div>
              <strong>{category.name}</strong>
              <small>{category.description}</small>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function UnclassifiedDataNote() {
  const english = useEnglishLanguage();
  const l = (zh: string, en: string) => localText(english, zh, en);
  return (
    <section className="data-schema-other" aria-labelledby="schema-other-title">
      <div className="data-schema-other-heading">
        <span className="data-schema-other-icon">
          <FileSearchOutlined />
        </span>
        <div>
          <Space size={8} wrap>
            <Typography.Title id="schema-other-title" level={4}>
              {l("未分组（其他）数据", "Unclassified (Other) data")}
            </Typography.Title>
            <Tag color="warning">
              {l("等待补充分类", "Awaiting classification")}
            </Tag>
          </Space>
          <Typography.Text type="secondary">
            {l(
              "这里集中显示暂时无法确定所属小类的数据。它不是第五个大类，也不会影响用户查看数据内容。",
              "This section collects data whose category is not yet known. It is not a fifth domain and does not prevent users from viewing the data.",
            )}
          </Typography.Text>
        </div>
      </div>
      <div
        className="data-schema-governance-flow"
        aria-label={l("未分组数据说明", "Unclassified data flow")}
      >
        <span>{l("分类暂未明确", "Category not yet confirmed")}</span>
        <i>→</i>
        <span>{l("仍可正常查看", "Remains viewable")}</span>
        <i>→</i>
        <span>{l("确认后归入对应小类", "Assigned after confirmation")}</span>
      </div>
    </section>
  );
}

function collectSelectableCategories(nodes: CatalogNode[]): CatalogNode[] {
  return nodes.flatMap((node) => [
    ...(node.selectable ? [node] : []),
    ...collectSelectableCategories(node.children),
  ]);
}
