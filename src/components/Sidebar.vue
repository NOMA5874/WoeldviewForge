<template>
  <aside class="sidebar-container">
    <div class="sidebar-header">
      <h3>📚 实体图谱</h3>
      <span class="count-badge">{{ totalEntries }}</span>
    </div>

    <!-- [契约升级] 二元域筛选器 -->
    <div class="domain-filters">
      <button :class="{active: domainFilter === 'all'}" @click="domainFilter = 'all'">全部</button>
      <button :class="{active: domainFilter === 'physical'}" @click="domainFilter = 'physical'">具象实体</button>
      <button :class="{active: domainFilter === 'conceptual'}" @click="domainFilter = 'conceptual'">抽象概念</button>
    </div>

    <div class="tree-container">
      <div v-if="Object.keys(groupedData).length === 0" class="empty-hint">当前视图无数据</div>

      <div class="category-group" v-for="(entries, category) in groupedData" :key="category">
        <h4 class="category-title"><span class="folder-icon">📂</span> {{ category || "未分类" }}</h4>
        <ul class="entry-list">
          <li v-for="entry in entries" :key="entry.id" class="entry-item" :class="{'is-active': store.currentActiveEntry?.id === entry.id}" @click="handleSelect(entry)">
            <!-- [契约升级] 优先显示 name，次选 id -->
            <div class="entry-name">{{ entry.name || entry.id }}</div>
            <!-- 如果存在 name，则将 id 作为小号标识展示在下方 -->
            <div class="entry-sub-id" v-if="entry.name">{{ entry.id }}</div>

            <div class="entry-tags" v-if="entry.tags && entry.tags.length">
              <span class="tag-micro" v-for="tag in entry.tags" :key="tag">{{ tag }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<script setup>
import {computed, ref} from "vue";
import {store, setActiveEntry} from "../store";

const totalEntries = computed(() => Object.keys(store.forgeData).length);
const domainFilter = ref("all"); // 新增筛选状态

// 数据加工管线：过滤 -> 分组
const groupedData = computed(() => {
  const query = store.searchQuery.toLowerCase();
  const groups = {};

  Object.values(store.forgeData).forEach((entry) => {
    // 1. 域筛选
    if (domainFilter.value !== "all" && entry.domain !== domainFilter.value) return;

    // 2. 搜索过滤
    if (query && !(entry.name?.toLowerCase().includes(query) || entry.id.toLowerCase().includes(query))) return;

    const cat = entry.sub_category || "Uncategorized";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(entry);
  });
  return groups;
});

const handleSelect = (entry) => {
  store.currentActiveEntry = entry;
  store.isEditing = false; // 仅仅选中条目
  // 此时 App.vue 检测到选中，Inspector 更新，GraphDashboard 高亮
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
.sidebar-header h3 {
  font-size: 1.1rem;
  color: var(--text-main);
}
.count-badge {
  /* 修复：将 #fff 修改为 var(--bg-surface)，确保无论背景色如何，文字始终高对比 */
  background: var(--text-main);
  color: var(--bg-surface);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
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
    &:hover {
      background: var(--action-hover);
    }
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
  text-transform: uppercase;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.entry-item {
  padding: 8px 10px;
  border-radius: var(--theme-radius);
  cursor: pointer;
  &:hover {
    background: var(--action-hover);
  }
  &.is-active {
    background: var(--bg-active);
    .entry-name {
      color: var(--action-primary);
      font-weight: bold;
    }
  }
  .entry-name {
    font-size: 0.95rem;
    color: var(--text-main);
  }
  .entry-sub-id {
    font-size: 0.7rem;
    color: var(--text-dim);
    margin-top: 2px;
  }
  .tag-micro {
    font-size: 0.7rem;
    background: var(--border-main);
    color: var(--text-dim);
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 4px;
    display: inline-block;
  }
}
</style>
