<template>
  <nav class="nav-container">
    <div class="brand" @click="exitToDashboard">ForgeWiki</div>

    <div class="nav-actions">
      <input type="text" v-model="store.searchQuery" placeholder="搜索条目..." class="search-input" />
      <button class="btn-nav" @click="exitToDashboard">图谱看板</button>

      <!-- 下拉主题选择器 -->
      <div class="theme-selector" ref="selectorRef">
        <button class="btn-nav" @click="showDropdown = !showDropdown">🎨 主题</button>
        <!-- 下拉菜单：仅在 showDropdown 为 true 时显示 -->
        <div class="dropdown-menu" v-if="showDropdown">
          <div v-for="theme in themeList" :key="theme.id" class="dropdown-item" :class="{active: store.currentTheme === theme.id}" @click="selectTheme(theme.id)">
            {{ theme.name }}
          </div>
        </div>
      </div>

      <button class="btn-new" @click="triggerNewEntry">新建</button>
    </div>
  </nav>
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount} from "vue";
import {store, setTheme, exitToDashboard, triggerNewEntry} from "../store";

const showDropdown = ref(false);
const selectorRef = ref(null); // 用于引用主题选择器 DOM

const themeList = [
  {id: "default", name: "默认模式"},
  {id: "summer", name: "夏日清凉"},
  {id: "midnight", name: "午夜极光"},
  {id: "retro", name: "陈年纸卷"},
];

// 点击外部关闭逻辑
const handleClickOutside = (event) => {
  if (selectorRef.value && !selectorRef.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

// 挂载时监听全局点击，卸载时移除
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const selectTheme = (id) => {
  setTheme(id);
  showDropdown.value = false;
};
</script>

<style scoped lang="scss">
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  /* 关键点：导航栏背景使用内容主色，文字使用页面背景色，天然保证对比度 */
  background: var(--text-main);
  color: var(--bg-page);
}

.brand {
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 1px;
  cursor: pointer;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  /* 使用卡片背景作为输入框背景，增加层次感 */
  background: var(--bg-active);
  border: 1px solid var(--border-main);
  padding: 6px 12px;
  border-radius: var(--theme-radius);
  color: var(--text-main);
  width: 200px;
  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.8;
  }
}

.btn-nav {
  background: transparent;
  color: var(--bg-active);
  border: 1px solid var(--bg-active);
  padding: 6px 12px;
  border-radius: var(--theme-radius);
  cursor: pointer;
  transition: all 0.2s ease;

  /* 关键点：悬浮时反转颜色，无需额外变量即可实现统一的交互反馈 */
  &:hover {
    background: var(--bg-active);
    color: var(--text-main);
  }
}

.btn-new {
  background: var(--action-primary);
  /* 使用 bg-surface 确保在 action-primary 上有足够的辨识度 */
  color: var(--bg-surface);
  border: none;
  padding: 6px 16px;
  border-radius: var(--theme-radius);
  cursor: pointer;
  font-weight: bold;
}

.theme-selector {
  position: relative;

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: var(--bg-surface);
    color: var(--text-main);
    border: var(--border-main);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 8px 0;
    width: 120px;
    z-index: 100;
  }

  .dropdown-item {
    padding: 8px 16px;
    cursor: pointer;
    &:hover {
      /* 使用 bg-active 作为悬浮状态，视觉更统一 */
      background: var(--bg-active);
    }
    &.active {
      color: var(--action-primary);
      font-weight: bold;
    }
  }
}
</style>
