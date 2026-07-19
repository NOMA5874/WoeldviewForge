<template>
  <aside class="sidebar-container">
    <div class="sidebar-header">
      <h3>📚 实体图谱</h3>
      <span class="count-badge" v-if="totalEntries > 0">{{ totalEntries }}</span>
    </div>

    <!-- 状态 1: 无数据时显示引导界面 -->
    <div v-if="totalEntries === 0" class="setup-container">
      <div class="setup-hint">尚未加载知识库</div>
      <button class="primary-btn" @click="handleLoadFolder"><span class="icon">📂</span> 打开文件夹</button>
    </div>

    <!-- 状态 2: 有数据时显示筛选与目录树 -->
    <template v-else>
      <div class="domain-filters">
        <button :class="{active: domainFilter === 'all'}" @click="domainFilter = 'all'">全部</button>
        <button :class="{active: domainFilter === 'physical'}" @click="domainFilter = 'physical'">具象</button>
        <button :class="{active: domainFilter === 'conceptual'}" @click="domainFilter = 'conceptual'">抽象</button>
      </div>

      <div class="tree-container">
        <div class="category-group" v-for="(entries, category) in groupedData" :key="category">
          <h4 class="category-title"><span class="folder-icon">📂</span> {{ category || "未分类" }}</h4>
          <ul class="entry-list">
            <li v-for="entry in entries" :key="entry.id" class="entry-item" :class="{'is-active': store.currentActiveEntry?.id === entry.id}" @click="handleSelect(entry)">
              <div class="entry-info">
                <div class="entry-name">{{ entry.name || entry.id }}</div>
                <div class="entry-sub-id">{{ entry.id }}</div>
                <div class="entry-tags" v-if="entry.tags && entry.tags.length">
                  <span class="tag-micro" v-for="tag in entry.tags" :key="tag">{{ tag }}</span>
                </div>
              </div>

              <!-- 独立复制按钮：使用 @click.stop 阻止冒泡，避免触发编辑拦截 -->
              <button class="copy-btn" @click.stop="copyInfo(entry)" title="复制名称与ID">📋</button>
            </li>
          </ul>
        </div>
      </div>
    </template>
    <div class="simple-toast" :class="{'is-visible': toastVisible}">
      {{ toastMessage }}
    </div>
  </aside>
</template>

<script setup>
import {computed, ref} from "vue";
import {store} from "../store";
import {requestDirectoryAccess} from "../services/dataService";

const totalEntries = computed(() => Object.keys(store.forgeData).length);
const domainFilter = ref("all");

const handleLoadFolder = async () => {
  try {
    const handle = await requestDirectoryAccess();
    if (!handle) return;
    await store.initData();
  } catch (error) {
    console.error("加载文件夹详细报错:", error);
    alert(`加载失败: ${error.message || error}`);
  }
};

const groupedData = computed(() => {
  const query = store.searchQuery?.toLowerCase() || "";
  const groups = {};

  Object.values(store.forgeData).forEach((entry) => {
    if (domainFilter.value !== "all" && entry.domain !== domainFilter.value) return;
    if (query && !(entry.name?.toLowerCase().includes(query) || entry.id.toLowerCase().includes(query))) return;

    const cat = entry.sub_category || "Uncategorized";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(entry);
  });
  return groups;
});

const toastVisible = ref(false);
const toastMessage = ref("");
let toastTimer = null;

const showToast = (message) => {
  toastMessage.value = message;
  toastVisible.value = true;

  // 自动隐藏逻辑
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
  }, 2000); // 2秒后消失
};

// 复制功能
const copyInfo = (entry) => {
  const text = `${entry.id}|${entry.name || entry.id}`;
  navigator.clipboard.writeText(text).then(() => {
    // 这种写法会让提示更有层次感
    showToast(`内容已复制：${text}`);
  });
};

// 选定逻辑（包含编辑保护）
const handleSelect = (entry) => {
  if (store.isEditing) {
    console.warn("当前处于编辑模式，已拦截切换请求");
    return;
  }
  store.currentActiveEntry = entry;
  store.isEditing = false;
};
</script>

<style scoped lang="scss">
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-surface);
}
.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-main);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.count-badge {
  background: var(--text-main);
  color: var(--bg-surface);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
}

.setup-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  color: var(--text-dim);
}
.primary-btn {
  padding: 10px 20px;
  background: var(--action-primary);
  color: white;
  border: none;
  border-radius: var(--theme-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    opacity: 0.9;
  }
}

.domain-filters {
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  background: var(--action-hover);
  border-bottom: 1px solid var(--border-main);
  button {
    flex: 1;
    background: transparent;
    border: 1px solid transparent;
    padding: 4px 0;
    cursor: pointer;
    border-radius: 4px;
    color: var(--text-dim);
    &.active {
      background: var(--text-main);
      color: var(--bg-surface);
      font-weight: bold;
    }
  }
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.category-title {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.entry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--theme-radius);
  cursor: pointer;
  position: relative;

  &:hover {
    background: var(--action-hover);
    // 悬停时显示复制按钮
    .copy-btn {
      opacity: 1;
    }
  }

  &.is-active {
    background: var(--bg-active);
    .entry-name {
      color: var(--action-primary);
      font-weight: bold;
    }
  }

  .entry-info {
    flex: 1;
    overflow: hidden;
  }
  .entry-name {
    font-size: 0.95rem;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .entry-sub-id {
    font-size: 0.7rem;
    color: var(--text-dim);
    margin-top: 2px;
  }

  // 复制按钮样式
  .copy-btn {
    opacity: 0; // 默认隐藏
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    transition: opacity 0.2s;
    font-size: 1rem;
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }
  }
}
/* Sidebar.vue 中的 style 部分 */
.simple-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  padding: 10px 20px; // 稍微增加一点内边距
  background: var(--text-main);
  color: var(--bg-surface);
  border-radius: 20px;
  font-size: 0.85rem;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 9999;

  /* --- 新增优化部分 --- */
  max-width: 80%; // 限制最大宽度，防止太长
  word-break: break-all; // 如果 ID 超长，强制换行，防止撑开容器
  white-space: normal; // 允许换行
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); // 加点阴影更醒目
  /* ------------------ */

  &.is-visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
