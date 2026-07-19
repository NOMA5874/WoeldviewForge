<template>
  <div class="theme-settings-overlay" @click.self="$emit('close')">
    <div class="settings-modal">
      <div class="modal-header">
        <h3>🎨 界面主题设置</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- 使用 Object.entries 显式遍历，确保分组渲染 -->
      <div v-for="[groupName, keys] in Object.entries(groupedConfigs)" :key="groupName" class="config-group">
        <h4 class="group-title">
          {{ groupName }}
          <span v-if="groupName.includes('谨慎')" class="hint">(固定业务标识)</span>
        </h4>

        <div class="settings-grid">
          <div class="field" v-for="key in keys" :key="key">
            <label>{{ formatLabel(key) }}</label>
            <div class="input-wrapper">
              <input type="color" v-model="store.themeConfig[key]" @input="handleInput" />
              <span class="hex-value">{{ store.themeConfig[key] }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="reset-btn" @click="handleReset">恢复默认</button>
        <button class="primary-btn" @click="$emit('close')">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {store} from "../store";

const groupedConfigs = {
  基础背景: ["bg-page", "bg-surface", "bg-canvas", "bg-inspector", "bg-active"],
  文字与边框: ["text-main", "text-secondary", "text-dim", "border-main"],
  交互动作: ["action-primary", "action-danger", "action-hover"],
  "状态语义色 (谨慎修改)": ["status-warn", "status-success", "status-info"],
  "领域映射 (Domain)": ["accent-physical", "accent-conceptual"],
};

const handleInput = () => store.applyTheme();

const handleReset = () => {
  if (confirm("确定要恢复默认配色吗？这将清除所有自定义设置。")) {
    store.resetTheme();
  }
};

const formatLabel = (key) => {
  return key.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
};
</script>

<style scoped lang="scss">
.theme-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.settings-modal {
  background: var(--bg-surface);
  padding: 24px;
  border-radius: 12px;
  width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-main);
  padding-bottom: 10px;
}
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.config-group {
  margin-bottom: 20px;
  padding: 10px;
  background: var(--bg-canvas);
  border-radius: 8px;
}

.group-title {
  font-size: 0.9rem;
  color: var(--text-main);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.hint {
  font-size: 0.75rem;
  color: var(--action-danger);
  font-weight: normal;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  input[type="color"] {
    border: none;
    width: 32px;
    height: 32px;
    cursor: pointer;
    background: none;
    padding: 0;
  }
  .hex-value {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--text-dim);
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  pt: 10px;
}
.reset-btn {
  background: transparent;
  color: var(--action-danger);
  border: 1px solid var(--action-danger);
  padding: 8px 16px;
  border-radius: var(--theme-radius);
  cursor: pointer;
}
.primary-btn {
  background: var(--action-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--theme-radius);
  cursor: pointer;
}
</style>
