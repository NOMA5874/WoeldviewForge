import {reactive} from "vue";
import {loadAllData, saveEntry, requestDirectoryAccess} from "./services/dataService";

export const store = reactive({
  forgeData: {},
  isEditing: false,
  currentActiveEntry: null,
  currentTheme: "summer", // 假设你有这个属性

  // 初始化加载
  async initData() {
    const hasAccess = await requestDirectoryAccess();
    if (hasAccess) {
      this.forgeData = await loadAllData();
    }
  },

  // 【核心方法】保存条目 (替代了原先的 saveCurrentEntry)
  async saveCurrentEntry(id, yamlString, fullData) {
    // 1. 调用服务层保存到磁盘
    const success = await saveEntry(id, yamlString);

    if (success) {
      // 2. 更新内存数据 (响应式更新)
      this.forgeData[id] = JSON.parse(JSON.stringify(fullData));

      // 3. 同步更新当前编辑态
      if (this.currentActiveEntry?.id === id) {
        this.currentActiveEntry = this.forgeData[id];
      }
      return true;
    }
    return false;
  },
});

// --- 数据同步与操作 ---

// 替换掉原先的 loadForgeData，改用 initData
export async function loadForgeData() {
  await store.initData();
}

export function exitToDashboard() {
  store.currentActiveEntry = null;
  store.isEditing = false;
}

export function toggleTheme() {
  store.currentTheme = store.currentTheme === "summer" ? "dark" : "summer";
  document.documentElement.setAttribute("data-theme", store.currentTheme);
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

export const setTheme = (themeName) => {
  store.currentTheme = themeName;
  document.documentElement.setAttribute("data-theme", themeName);
  localStorage.setItem("theme", themeName);
};
