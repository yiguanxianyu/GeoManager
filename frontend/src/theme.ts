import { type ThemeConfig, theme } from "antd";

const workspaceText = "#dff8ee";
const workspaceTextStrong = "#eafff8";
const workspaceTextMuted = "rgba(223, 248, 238, 0.64)";
const workspaceTextPlaceholder = "rgba(223, 248, 238, 0.5)";
const workspaceAccent = "#74f3dd";
const workspaceAccentSoft = "rgba(34, 197, 143, 0.16)";
const workspaceAccentActive = "rgba(34, 197, 143, 0.22)";
const workspaceControlBg = "rgba(8, 32, 42, 0.62)";
const workspaceControlBgSubtle = "rgba(8, 32, 42, 0.38)";
const workspaceControlBgDisabled = "rgba(8, 32, 42, 0.24)";
const workspaceElevatedBg = "rgba(7, 30, 38, 0.94)";
const workspaceBorder = "rgba(95, 231, 221, 0.24)";
const workspaceBorderSubtle = "rgba(95, 231, 221, 0.14)";
const workspaceBorderHover = "rgba(116, 243, 221, 0.48)";
const workspaceOutline = "rgba(116, 243, 221, 0.12)";

const workspaceInputTokens = {
  activeBg: workspaceControlBg,
  activeBorderColor: workspaceAccent,
  activeShadow: `0 0 0 2px ${workspaceOutline}`,
  hoverBg: workspaceControlBg,
  hoverBorderColor: workspaceBorderHover,
};

export const appTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: "#2f7d62",
    colorInfo: "#2f7d62",
    borderRadius: 6,
    fontFamily: '"Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  components: {
    Button: { controlHeight: 34 },
    Card: { borderRadiusLG: 8 },
    Layout: {
      bodyBg: "#eef3ef",
      headerBg: "#173f39",
      siderBg: "#f8faf7",
    },
    Tabs: { itemSelectedColor: "#2f7d62" },
  },
};

export const workspacePanelTheme: ThemeConfig = {
  inherit: true,
  token: {
    colorPrimary: workspaceAccent,
    colorPrimaryHover: workspaceTextStrong,
    colorInfo: workspaceAccent,
    colorText: workspaceText,
    colorTextBase: workspaceText,
    colorTextSecondary: workspaceTextMuted,
    colorTextTertiary: "rgba(223, 248, 238, 0.48)",
    colorTextQuaternary: "rgba(223, 248, 238, 0.38)",
    colorTextDisabled: "rgba(223, 248, 238, 0.38)",
    colorTextPlaceholder: workspaceTextPlaceholder,
    colorBgContainer: workspaceControlBg,
    colorBgContainerDisabled: workspaceControlBgDisabled,
    colorBgElevated: workspaceElevatedBg,
    colorBgTextHover: workspaceAccentSoft,
    colorBgTextActive: workspaceAccentActive,
    colorBorder: workspaceBorder,
    colorBorderSecondary: workspaceBorderSubtle,
    controlItemBgHover: workspaceAccentSoft,
    controlItemBgActive: workspaceAccentActive,
    controlItemBgActiveHover: "rgba(34, 197, 143, 0.28)",
    controlOutline: workspaceOutline,
  },
  components: {
    Button: {
      colorPrimary: "rgba(34, 197, 143, 0.32)",
      colorPrimaryActive: "rgba(34, 197, 143, 0.48)",
      colorPrimaryHover: "rgba(34, 197, 143, 0.42)",
      colorTextLightSolid: workspaceTextStrong,
      defaultBg: workspaceControlBgSubtle,
      defaultBorderColor: workspaceBorder,
      defaultColor: workspaceText,
      defaultHoverBg: workspaceAccentSoft,
      defaultHoverBorderColor: "rgba(116, 243, 221, 0.5)",
      defaultHoverColor: workspaceTextStrong,
      defaultActiveBg: workspaceAccentActive,
      defaultActiveBorderColor: workspaceAccent,
      defaultActiveColor: workspaceTextStrong,
      defaultGhostBorderColor: "rgba(116, 243, 221, 0.5)",
      defaultGhostColor: workspaceAccent,
      defaultShadow: "none",
      ghostBg: "rgba(8, 32, 42, 0.28)",
      primaryShadow: "none",
    },
    DatePicker: {
      ...workspaceInputTokens,
      cellHoverBg: workspaceAccentSoft,
      cellActiveWithRangeBg: workspaceAccentActive,
      cellHoverWithRangeBg: "rgba(34, 197, 143, 0.28)",
      cellRangeBorderColor: workspaceAccent,
      multipleItemBg: "rgba(8, 32, 42, 0.46)",
      multipleItemBorderColor: workspaceBorder,
    },
    Descriptions: {
      contentColor: workspaceText,
      extraColor: workspaceTextMuted,
      labelBg: "rgba(7, 30, 38, 0.46)",
      labelColor: workspaceText,
      titleColor: workspaceTextStrong,
    },
    Dropdown: {
      colorBgElevated: workspaceElevatedBg,
      colorText: workspaceText,
      controlItemBgHover: workspaceAccentSoft,
      controlItemBgActive: workspaceAccentActive,
    },
    Empty: {
      colorTextDescription: "rgba(223, 248, 238, 0.58)",
    },
    Input: workspaceInputTokens,
    InputNumber: {
      ...workspaceInputTokens,
      handleActiveBg: workspaceAccentActive,
      handleBg: workspaceControlBgSubtle,
      handleBorderColor: workspaceBorderSubtle,
      handleHoverColor: workspaceAccent,
    },
    Popover: {
      colorBgElevated: workspaceElevatedBg,
      colorText: workspaceText,
      zIndexPopup: 1070,
    },
    Segmented: {
      itemActiveBg: workspaceAccentSoft,
      itemColor: workspaceTextMuted,
      itemHoverBg: workspaceAccentSoft,
      itemHoverColor: workspaceTextStrong,
      itemSelectedBg: workspaceControlBg,
      itemSelectedColor: workspaceAccent,
      trackBg: "rgba(7, 30, 38, 0.48)",
    },
    Select: {
      activeBorderColor: workspaceAccent,
      activeOutlineColor: workspaceOutline,
      clearBg: workspaceControlBg,
      hoverBorderColor: workspaceBorderHover,
      multipleItemBg: "rgba(8, 32, 42, 0.46)",
      multipleItemBorderColor: workspaceBorder,
      optionActiveBg: workspaceAccentSoft,
      optionSelectedBg: workspaceAccentActive,
      optionSelectedColor: workspaceAccent,
      selectorBg: workspaceControlBg,
    },
    Slider: {
      dotActiveBorderColor: workspaceAccent,
      dotBorderColor: workspaceBorder,
      handleActiveColor: workspaceAccent,
      handleActiveOutlineColor: workspaceOutline,
      handleColor: workspaceAccent,
      railBg: "rgba(95, 231, 221, 0.14)",
      railHoverBg: "rgba(95, 231, 221, 0.22)",
      trackBg: "rgba(116, 243, 221, 0.62)",
      trackHoverBg: workspaceAccent,
    },
    Tabs: {
      inkBarColor: "#62ecd9",
      itemActiveColor: workspaceAccent,
      itemColor: "rgba(223, 248, 238, 0.66)",
      itemHoverColor: workspaceTextStrong,
      itemSelectedColor: workspaceAccent,
    },
    Tag: {
      defaultBg: "rgba(8, 32, 42, 0.46)",
      defaultColor: workspaceText,
      solidTextColor: workspaceText,
    },
  },
};
