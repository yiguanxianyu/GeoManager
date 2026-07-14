import { Button, Collapse, InputNumber, Select, Switch } from "antd";
import {
  suggestedGeographicGridInterval,
  suggestedProjectedGridInterval,
  type MapCompositionLayout,
} from "../../map-composition/layout";
import {
  applyPaperPreset,
  restoreStandardCompositionLayout,
} from "../../map-composition/layoutPaper";
import {
  BoundsEditor,
  BoxEditor,
  Field,
  TextEditor,
  Toggle,
} from "./CompositionFieldEditors";

interface Props {
  layout: MapCompositionLayout;
  onChange: (layout: MapCompositionLayout) => void;
}

export default function CompositionSettings({ layout, onChange }: Props) {
  function patchPage(values: Partial<MapCompositionLayout["page"]>) {
    onChange({ ...layout, page: { ...layout.page, ...values } });
  }
  function patchElement<Key extends keyof MapCompositionLayout>(
    key: Key,
    values: Partial<MapCompositionLayout[Key]>,
  ) {
    const current = layout[key] as Record<string, unknown>;
    onChange({
      ...layout,
      [key]: { ...current, ...values },
    });
  }

  return (
    <Collapse
      className="composition-settings"
      defaultActiveKey={["page", "map", "elements", "notes"]}
      items={[
        {
          key: "page",
          label: "页面设置",
          children: (
            <div className="composition-field-grid">
              <Field label="纸张">
                <Select
                  value={layout.page.preset}
                  options={[
                    { label: "A4", value: "A4" },
                    { label: "A3", value: "A3" },
                  ]}
                  onChange={(preset) =>
                    onChange(
                      applyPaperPreset(layout, preset, layout.page.orientation),
                    )
                  }
                />
              </Field>
              <Field label="方向">
                <Select
                  value={layout.page.orientation}
                  options={[
                    { label: "横向", value: "landscape" },
                    { label: "纵向", value: "portrait" },
                  ]}
                  onChange={(orientation) =>
                    onChange(
                      applyPaperPreset(layout, layout.page.preset, orientation),
                    )
                  }
                />
              </Field>
              <Field label="DPI">
                <InputNumber
                  min={72}
                  max={600}
                  step={10}
                  value={layout.page.dpi}
                  onChange={(value) =>
                    typeof value === "number" && patchPage({ dpi: value })
                  }
                />
              </Field>
              <Field label="背景">
                <input
                  type="color"
                  value={layout.page.backgroundColor}
                  onChange={(event) =>
                    patchPage({ backgroundColor: event.target.value })
                  }
                />
              </Field>
              <div className="composition-standard-layout-action">
                <Button
                  block
                  onClick={() =>
                    onChange(restoreStandardCompositionLayout(layout))
                  }
                >
                  恢复标准版式
                </Button>
                <small>
                  保留标题、地图范围和说明内容，重新整理全部要素并恢复白色纸张。
                </small>
              </div>
            </div>
          ),
        },
        {
          key: "map",
          label: "地图框与范围",
          children: (
            <>
              <BoundsEditor
                value={layout.mapFrame.bounds}
                onChange={(bounds) => patchElement("mapFrame", { bounds })}
              />
              <BoxEditor
                value={layout.mapFrame}
                onChange={(values) => patchElement("mapFrame", values)}
              />
              <div className="composition-field-grid">
                <Field label="格网">
                  <Switch
                    checked={layout.grid.enabled}
                    onChange={(enabled) => patchElement("grid", { enabled })}
                  />
                </Field>
                <Field label="类型">
                  <Select
                    disabled={!layout.grid.enabled}
                    value={layout.grid.type}
                    options={[
                      { label: "经纬网", value: "geographic" },
                      { label: "Web Mercator 投影格网", value: "projected" },
                    ]}
                    onChange={(type) =>
                      patchElement("grid", {
                        type,
                        interval:
                          type === "projected"
                            ? suggestedProjectedGridInterval(
                                layout.mapFrame.bounds,
                              )
                            : suggestedGeographicGridInterval(
                                layout.mapFrame.bounds,
                              ),
                      })
                    }
                  />
                </Field>
                <Field
                  label={
                    layout.grid.type === "projected"
                      ? "间隔（米）"
                      : "间隔（度）"
                  }
                >
                  <InputNumber
                    disabled={!layout.grid.enabled}
                    min={layout.grid.type === "projected" ? 10 : 0.0001}
                    step={layout.grid.type === "projected" ? 100 : 0.001}
                    value={layout.grid.interval}
                    onChange={(interval) =>
                      typeof interval === "number" &&
                      patchElement("grid", { interval })
                    }
                  />
                </Field>
              </div>
            </>
          ),
        },
        {
          key: "elements",
          label: "地图整饰要素",
          children: (
            <div className="composition-element-settings">
              <TextEditor
                label="标题"
                value={layout.title}
                onChange={(values) => patchElement("title", values)}
              />
              <TextEditor
                label="副标题"
                value={layout.subtitle}
                onChange={(values) => patchElement("subtitle", values)}
              />
              <Toggle
                label="图例"
                checked={layout.legend.enabled}
                onChange={(enabled) => patchElement("legend", { enabled })}
              />
              <Toggle
                label="指北针"
                checked={layout.northArrow.enabled}
                onChange={(enabled) => patchElement("northArrow", { enabled })}
              />
              <Toggle
                label="比例尺"
                checked={layout.scaleBar.enabled}
                onChange={(enabled) => patchElement("scaleBar", { enabled })}
              />
              <Toggle
                label="区位副图"
                checked={layout.overview.enabled}
                onChange={(enabled) => patchElement("overview", { enabled })}
              />
              {layout.overview.enabled ? (
                <>
                  <BoundsEditor
                    value={layout.overview.bounds}
                    onChange={(bounds) => patchElement("overview", { bounds })}
                  />
                  <BoxEditor
                    value={layout.overview}
                    onChange={(values) => patchElement("overview", values)}
                  />
                </>
              ) : null}
            </div>
          ),
        },
        {
          key: "notes",
          label: "数据来源与制图说明",
          children: (
            <>
              <TextEditor
                label="数据来源"
                value={layout.source}
                multiline
                onChange={(values) => patchElement("source", values)}
              />
              <TextEditor
                label="制图说明"
                value={layout.note}
                multiline
                onChange={(values) => patchElement("note", values)}
              />
            </>
          ),
        },
      ]}
    />
  );
}
