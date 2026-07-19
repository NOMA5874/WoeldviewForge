<template>
  <nav class="nav-container">
    <div class="brand" @click="exitToDashboard">ForgeWiki</div>

    <div class="nav-actions">
      <input type="text" v-model="store.searchQuery" placeholder="搜索条目..." class="search-input" />
      <button class="btn-nav" @click="exitToDashboard">图谱看板</button>

      <!-- 修改：将下拉菜单改为打开设置面板的按钮 -->
      <button class="btn-nav" @click="isSettingsOpen = true">🎨 设置主题</button>

      <button class="btn-new" @click="triggerNewEntry">新建</button>
    </div>

    <!-- 模态框组件 -->
    <ThemeSettings v-if="isSettingsOpen" @close="isSettingsOpen = false" />
  </nav>
</template>

<script setup>
import {ref} from "vue";
import {store, exitToDashboard, triggerNewEntry} from "../store";
import ThemeSettings from "./ThemeSettings.vue"; // 确保路径正确

const isSettingsOpen = ref(false);
</script>

<style scoped lang="scss">
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
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

  &:hover {
    background: var(--bg-active);
    color: var(--text-main);
  }
}

.btn-new {
  background: var(--action-primary);
  color: var(--bg-surface);
  border: none;
  padding: 6px 16px;
  border-radius: var(--theme-radius);
  cursor: pointer;
  font-weight: bold;
}
</style>
