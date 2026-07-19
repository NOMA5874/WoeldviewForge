import {reactive} from "vue";
import {loadAllData, saveEntry, requestDirectoryAccess} from "./services/dataService";

// 1. 定义默认主题变量基准
export const DEFAULT_THEME_CONFIG = {
  // 1. 背景与底色
  "bg-page": "#f5f5f5",
  "bg-surface": "#ffffff",
  "bg-canvas": "#f0f0f0",
  "bg-inspector": "#ffffff",
  "bg-active": "#e5e7eb",
  // 2. 文字与边框
  "text-main": "#333333",
  "text-secondary": "#888888",
  "text-dim": "#a0a0a0",
  "border-main": "#e0e0e0",
  // 3. 交互与状态
  "action-primary": "#3b82f6",
  "action-danger": "#ef4444",
  "action-hover": "#eff6ff",
  "status-warn": "#f59e0b",
  "status-success": "#10b981",
  "status-info": "#6366f1",
  // 4. 域专有
  "accent-physical": "#3b82f6",
  "accent-conceptual": "#a855f7",
};

export const store = reactive({
  forgeData: {},
  isEditing: false,
  currentActiveEntry: null,

  // 2. 当前主题配置，初始化时优先从 localStorage 读取
  themeConfig: {
    ...DEFAULT_THEME_CONFIG,
    ...JSON.parse(localStorage.getItem("user-theme") || "{}"),
  },

  // 初始化加载数据
  async initData() {
    const hasAccess = await requestDirectoryAccess();
    if (hasAccess) {
      this.forgeData = await loadAllData();
    }
  },

  // 【核心方法】保存条目
  async saveCurrentEntry(id, yamlString, fullData) {
    const success = await saveEntry(id, yamlString);
    if (success) {
      this.forgeData[id] = JSON.parse(JSON.stringify(fullData));
      if (this.currentActiveEntry?.id === id) {
        this.currentActiveEntry = this.forgeData[id];
      }
      return true;
    }
    return false;
  },

  // 3. 应用主题到 DOM
  applyTheme(config = this.themeConfig) {
    const root = document.documentElement;
    Object.entries(config).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
      this.themeConfig[key] = value;
    });
    localStorage.setItem("user-theme", JSON.stringify(this.themeConfig));
  },

  // 4. 重置主题
  resetTheme() {
    this.themeConfig = {...DEFAULT_THEME_CONFIG};
    localStorage.removeItem("user-theme");
    this.applyTheme(DEFAULT_THEME_CONFIG);
  },
});

// --- 初始化时自动应用主题 ---
store.applyTheme(store.themeConfig);

// --- 数据同步与操作 ---

export async function loadForgeData() {
  await store.initData();
}

export function exitToDashboard() {
  store.currentActiveEntry = null;
  store.isEditing = false;
}

export function setActiveEntry(id) {
  if (store.forgeData[id]) {
    store.currentActiveEntry = JSON.parse(JSON.stringify(store.forgeData[id]));
  }
}

export function triggerNewEntry() {
  store.currentActiveEntry = {
    id: `new_entity_${Date.now()}`,
    name: "",
    domain: "physical",
    sub_category: "character",
    summary: "",
    tags: [],
    properties: {},
    info: [],
    relations: [],
  };
  store.isEditing = true;
}
