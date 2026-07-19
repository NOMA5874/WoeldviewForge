<template>
  <div class="inspector-container">
    <div v-if="!store.currentActiveEntry" class="empty-state">
      <p>👈 请在侧边栏选择一个实体以查看详情</p>
      <p>或点击上方“新建”创建条目</p>
    </div>

    <div v-else class="inspector-content">
      <div class="header-actions">
        <button class="btn-edit-trigger" @click="startEditing">📝 编辑条目</button>
      </div>

      <header class="meta-header">
        <div class="domain-badge" :class="`is-${entry.domain}`">
          {{ entry.domain === "physical" ? "🧱 具象域" : "🌌 抽象域" }}
        </div>
        <h2 class="entry-title">{{ entry.name || entry.id }}</h2>
        <div class="entry-real-id" v-if="entry.name">ID: {{ entry.id }}</div>
        <div class="sub-category-label">{{ entry.sub_category }}</div>
      </header>

      <blockquote class="summary-block" v-if="entry.summary">"{{ entry.summary }}"</blockquote>

      <!-- 新增：关系网络面板 -->
      <section class="prop-section" v-if="hasRelations">
        <h4 class="section-title">🔗 人物关系 (Relationships)</h4>
        <div class="relation-list">
          <div v-for="(rel, index) in entry.relations" :key="index" class="rel-item">
            <span :class="['rel-badge', `type-${rel.type}`]">{{ getRelLabel(rel.type) }}</span>
            <span class="rel-target" @click="navigateTo(rel.target)">
              {{ getTargetName(rel.target) }}
            </span>
            <span class="rel-desc">{{ rel.description }}</span>
          </div>
        </div>
      </section>

      <section class="prop-section" v-if="hasProperties">
        <h4 class="section-title">📊 静态属性 (Properties)</h4>
        <table class="prop-table">
          <tbody>
            <tr v-for="(val, key) in entry.properties" :key="key">
              <td class="prop-key">{{ key }}</td>
              <td class="prop-val" v-html="parseTokens(String(val))"></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="info-section" v-if="entry.info && entry.info.length">
        <h4 class="section-title">📖 详情列 (Info)</h4>
        <div class="info-block" v-for="(block, index) in entry.info" :key="index">
          <h5 class="info-title">{{ block.title }}</h5>
          <div class="info-content" v-html="parseTokens(block.content)"></div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import {computed} from "vue";
import {store, setActiveEntry} from "../store";

const entry = computed(() => {
  // 直接依赖 store.currentActiveEntry，Vue 会自动追踪
  const currentId = store.currentActiveEntry?.id;
  return currentId ? store.forgeData[currentId] : store.currentActiveEntry;
});
const hasProperties = computed(() => entry.value && entry.value.properties && Object.keys(entry.value.properties).length > 0);
const hasRelations = computed(() => entry.value?.sub_category === "character" && entry.value?.relations?.length > 0);

const startEditing = () => {
  store.isEditing = true;
};

// 关系名称映射
const getRelLabel = (type) => {
  const map = {hostile: "敌对", friendly: "友善", neutral: "中立"};
  return map[type] || type;
};

// 获取目标显示名，回退到ID
const getTargetName = (id) => {
  return store.forgeData[id]?.name || id;
};

const navigateTo = (id) => {
  if (store.forgeData[id]) setActiveEntry(id);
  else alert(`目标 [${id}] 不存在`);
};

const parseTokens = (text) => {
  if (!text) return "";
  const tokenRegex = /\[(.*?):(.*?)\|(.*?)\]/g;
  return text.replace(tokenRegex, (match, type, arg, label) => {
    if (type === "style") return `<span class="semantic-style style-${arg}">${label}</span>`;
    return `<span class="entity-link token-${type}" onclick="window.__triggerEntityNav('${arg}')">#${label}</span>`;
  });
};

if (typeof window !== "undefined") {
  window.__triggerEntityNav = (id) => {
    if (store.forgeData[id]) setActiveEntry(id);
    else alert(`目标实体 [${id}] 在当前图谱中不存在！`);
  };
}
</script>

<style scoped lang="scss">
.inspector-container {
  height: 100%;
  overflow-y: auto;
  background: var(--bg-surface);
}

.header-actions {
  padding: 16px 24px 0 24px;
  .btn-edit-trigger {
    width: 100%;
    background: var(--action-primary);
    /* 优化：使用 bg-surface 代替 white，保证对比度 */
    color: var(--bg-surface);
    border: none;
    padding: 8px;
    border-radius: var(--theme-radius);
    cursor: pointer;
    font-weight: bold;
    transition: opacity 0.2s;
    &:hover {
      opacity: 0.9;
    }
  }
}

.meta-header {
  padding: 24px;
  .domain-badge {
    font-size: 0.75rem;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    display: inline-block;
    /* 优化：使用 bg-surface 代替 #fff */
    color: var(--bg-surface);
    &.is-physical {
      background: var(--accent-physical);
    }
    &.is-conceptual {
      background: var(--accent-conceptual);
    }
  }
  .entry-title {
    font-size: 1.5rem;
    margin: 8px 0;
    color: var(--text-main);
  }
  .entry-real-id {
    font-size: 0.85rem;
    color: var(--text-dim);
  }
}

.summary-block {
  margin: 0 24px;
  padding: 12px 16px;
  border-left: 4px solid var(--action-primary);
  background: var(--action-hover);
  color: var(--text-main);
}

.section-title {
  font-size: 1rem;
  color: var(--text-dim);
  border-bottom: 1px solid var(--border-main);
  padding: 12px 24px 8px;
  margin: 0;
}

.prop-table {
  width: 100%;
  border-collapse: collapse;
}
.prop-key {
  width: 40%;
  color: var(--text-dim);
  padding: 8px 24px;
  border-bottom: 1px dashed var(--border-main);
}
.prop-val {
  font-weight: bold;
  color: var(--text-main);
  padding: 8px 24px;
  border-bottom: 1px dashed var(--border-main);
}

:deep(.entity-link) {
  cursor: pointer;
  color: var(--action-primary);
  background: var(--action-hover);
  padding: 0 4px;
  border-radius: 3px;
  &:hover {
    background: var(--action-primary);
    /* 优化：使用 bg-surface 代替 #fff */
    color: var(--bg-surface);
  }
}

:deep(.semantic-style) {
  font-weight: bold;
  &.style-warning {
    color: var(--status-warn);
  }
  &.style-success {
    color: var(--status-success);
  }
  &.style-info {
    color: var(--status-info);
  }
}

.relation-list {
  padding: 8px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  .rel-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }
  .rel-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    /* 优化：使用 bg-surface 代替 white */
    color: var(--bg-surface);
    &.type-hostile {
      background: var(--status-warn);
    }
    &.type-friendly {
      background: var(--status-success);
    }
    &.type-neutral {
      background: var(--status-info);
    }
  }
  .rel-target {
    cursor: pointer;
    font-weight: bold;
    color: var(--action-primary);
    &:hover {
      text-decoration: underline;
    }
  }
  .rel-desc {
    color: var(--text-dim);
    font-size: 0.85rem;
  }
}
</style>
