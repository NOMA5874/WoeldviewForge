import {reactive} from "vue";
import {fetchForgeData} from "./api"; // 假设 api.js 包含此方法

export const store = reactive({
  forgeData: {}, // 数据的唯一真实来源 (Source of Truth)
  currentActiveEntry: null, // 当前编辑或查看的对象
  searchQuery: "",
  currentTheme: localStorage.getItem("theme") || "default",
  isEditing: false,
});

// --- 数据加载 ---
export async function loadForgeData() {
  const response = await fetchForgeData();
  if (response.success) {
    // 直接赋值，Vue 能够自动追踪 forgeData 的整体变化
    store.forgeData = response.data;
  }
}

// --- 状态操作 ---
export function exitToDashboard() {
  store.currentActiveEntry = null;
  store.isEditing = false;
}

export function toggleTheme() {
  store.currentTheme = store.currentTheme === "summer" ? "dark" : "summer";
  document.documentElement.setAttribute("data-theme", store.currentTheme);
}

// 设置选中条目 (保持深拷贝，避免直接修改原始数据)
export function setActiveEntry(id) {
  if (store.forgeData[id]) {
    store.currentActiveEntry = JSON.parse(JSON.stringify(store.forgeData[id]));
  }
}

export function triggerNewEntry() {
  // 1. 初始化空白数据
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

  // 2. 确保面板被打开
  store.isEditing = true;
}

// --- 数据持久化与同步 ---
export const saveEntry = async (id, yamlString, fullData) => {
  try {
    const response = await fetch("/api/save-entry", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({id, content: yamlString, data: fullData}),
    });

    const result = await response.json();

    if (result.success) {
      // 核心优化点：直接更新数据源，Vue 会自动通知所有组件刷新
      store.forgeData[id] = JSON.parse(JSON.stringify(fullData));

      // 如果当前正在编辑此项，同步更新 UI 展示
      if (store.currentActiveEntry?.id === id) {
        store.currentActiveEntry = store.forgeData[id];
      }
      return true;
    }

    console.error("后端拒绝请求:", result.message);
    return false;
  } catch (err) {
    console.error("网络/解析错误:", err);
    return false;
  }
};

export const setTheme = (themeName) => {
  store.currentTheme = themeName;
  document.documentElement.setAttribute("data-theme", themeName);
  localStorage.setItem("theme", themeName);
};
