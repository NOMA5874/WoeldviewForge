<template>
  <div class="app-container" :data-theme="store.currentTheme" :class="{'is-resizing': isResizing}">
    <Navigator />

    <div class="main-layout">
      <!-- 侧边栏：绑定动态宽度 -->
      <Sidebar class="layout-sidebar" :style="{width: sidebarWidth + 'px'}" />

      <!-- 左侧分割线 -->
      <div class="resizer" @mousedown="startResizing('sidebar')"></div>

      <!-- 主工作区 -->
      <div class="layout-canvas">
        <YamlEditor v-if="store.isEditing && store.currentActiveEntry" :key="store.currentActiveEntry.id" />
        <GraphDashboard v-else />
      </div>

      <!-- 右侧分割线 -->
      <div class="resizer" @mousedown="startResizing('inspector')"></div>

      <!-- 检查器：绑定动态宽度 -->
      <Inspector class="layout-inspector" :style="{width: inspectorWidth + 'px'}" />
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, onUnmounted} from "vue";
import {store, loadForgeData} from "./store";
import Navigator from "./components/Navigator.vue";
import Sidebar from "./components/Sidebar.vue";
import Inspector from "./components/Inspector.vue";
import YamlEditor from "./components/YamlEditor.vue";
import GraphDashboard from "./components/GraphDashboard.vue";

const sidebarWidth = ref(260);
const inspectorWidth = ref(320);
const isResizing = ref(false);
let activeResizer = null;

const startResizing = (type) => {
  isResizing.value = true;
  activeResizer = type;

  // 关键修复：拖拽开始时全局禁止选中
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", stopResizing);
};

const handleMouseMove = (e) => {
  if (!isResizing.value) return;

  if (activeResizer === "sidebar") {
    // 强制最小宽度为 240px，最大宽度保持 600px
    sidebarWidth.value = Math.max(240, Math.min(600, e.clientX));
  } else if (activeResizer === "inspector") {
    // 强制最小宽度为 240px，最大宽度保持 600px
    inspectorWidth.value = Math.max(240, Math.min(600, window.innerWidth - e.clientX));
  }
};

const stopResizing = () => {
  isResizing.value = false;
  activeResizer = null;

  // 关键修复：拖拽结束恢复正常
  document.body.style.userSelect = "";
  document.body.style.cursor = "";

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", stopResizing);
};
onMounted(() => {
  document.documentElement.setAttribute("data-theme", store.currentTheme);
  loadForgeData();
});
</script>

<style lang="scss">
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;

  // 拖拽时禁止文字选中，防止视觉干扰
  &.is-resizing {
    user-select: none;
    cursor: col-resize;
    -webkit-user-select: none; /* 针对 Safari */
  }
}

/* 分割线样式 */
.resizer {
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 10;
  position: relative;
  height: 100%;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: -4px;
    right: -4px;
  }

  &:hover {
    background-color: var(--color-accent);
  }

  // 拖拽时让颜色更明显
  .is-resizing & {
    background-color: var(--color-accent);
  }
}

.layout-sidebar {
  border-right: 1px solid var(--color-border);
}

.layout-inspector {
  border-left: 1px solid var(--color-border);
}

.layout-sidebar,
.layout-inspector {
  flex-shrink: 0;
  overflow: hidden; // 防止内容溢出导致抖动
}

.layout-canvas {
  flex: 1;
  min-width: 0; // 关键：防止 flex 子项在宽度不足时撑开容器
  overflow: hidden;
  background: var(--color-bg-page);
}
</style>
