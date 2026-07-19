<template>
  <div class="yaml-editor-container">
    <header class="editor-header">
      <div class="title-area">
        <button class="btn-back" @click="store.isEditing = false">← 返回看板</button>
        <!-- 使用可选链防止崩溃 -->
        <h3>编辑实体: {{ store.currentActiveEntry?.id || "新建实体" }}</h3>
      </div>
      <button class="btn-save" @click="handleSave" :disabled="isSaving">
        {{ isSaving ? "保存中..." : "保存修改" }}
      </button>
    </header>

    <div class="editor-body">
      <section class="visual-form">
        <!-- 基础元数据区 -->
        <div class="form-row grid-4">
          <div class="form-group">
            <label>唯一标识 (ID)</label>
            <input type="text" v-model.lazy="form.id" :disabled="isExistingEntry" placeholder="不可变标识" />
          </div>
          <div class="form-group">
            <label>显示名 (Name)</label>
            <input type="text" v-model="form.name" placeholder="人类可读名称" />
          </div>
          <div class="form-group">
            <label>二元域 (Domain)</label>
            <select v-model="form.domain">
              <option value="physical">具象实体域 (Physical)</option>
              <option value="conceptual">抽象概念域 (Conceptual)</option>
            </select>
          </div>
          <div class="form-group">
            <label>子分类 (Sub-category)</label>
            <div class="category-suggestions">
              <button type="button" class="suggestion-chip" v-for="cat in allExistingSubCategories" :key="cat" @click="form.sub_category = cat">
                {{ cat }}
              </button>
            </div>
            <input type="text" v-model="form.sub_category" placeholder="输入新分类或点击上方标签" />
          </div>
        </div>

        <div class="form-group">
          <label>全局简介 (Summary)</label>
          <textarea v-model="form.summary" rows="2" placeholder="用于卡片预览的一句话简介..."></textarea>
        </div>

        <!-- 标签阵列区 -->
        <div class="form-group complex-group">
          <label>特性标签 (Tags)</label>
          <div class="tags-container">
            <span class="tag-chip" v-for="(tag, index) in form.tags" :key="index">
              {{ tag }}
              <button class="btn-remove-icon" @click="removeTag(index)">×</button>
            </span>
            <input type="text" class="tag-input" v-model="newTagInput" @keydown.enter.prevent="addTag" placeholder="输入标签后按 Enter 添加" />
          </div>
        </div>

        <!-- 静态属性池 -->
        <div class="form-group complex-group">
          <label class="group-header">
            静态属性池 (Properties)
            <button class="btn-mini" @click="addProperty">+ 添加属性</button>
          </label>
          <div class="property-list">
            <div class="property-item" v-for="(val, key) in form.properties" :key="key">
              <input type="text" class="prop-key" :value="key" @change="updatePropertyKey(key, $event.target.value)" placeholder="属性名" />
              <span class="separator">:</span>
              <input type="text" class="prop-val" v-model="form.properties[key]" placeholder="属性值" />
              <button class="btn-remove-icon" @click="removeProperty(key)">×</button>
            </div>
          </div>
        </div>

        <!-- 关系网络 -->
        <div v-if="form.sub_category === 'character'" class="form-group complex-group">
          <label class="group-header">
            🔗 关系网络 (Relationships)
            <button class="btn-mini" @click="addRelation">+ 添加关系</button>
          </label>
          <div class="relation-list">
            <div class="relation-item" v-for="(rel, index) in form.relations" :key="index">
              <input type="text" v-model="rel.target" placeholder="目标实体 ID" class="rel-target" />
              <select v-model="rel.type" class="rel-type">
                <option value="hostile">敌对 (Hostile)</option>
                <option value="neutral">中立 (Neutral)</option>
                <option value="friendly">友善 (Friendly)</option>
              </select>
              <input type="text" v-model="rel.description" placeholder="关系备注" class="rel-desc" />
              <button class="btn-remove-icon" @click="removeRelation(index)">×</button>
            </div>
          </div>
        </div>

        <!-- 动态详情列 -->
        <div class="form-group complex-group">
          <label class="group-header">
            动态详情列 (Info)
            <button class="btn-mini" @click="addInfoBlock">+ 添加文本块</button>
          </label>
          <div class="info-list">
            <div class="info-item" v-for="(block, index) in form.info" :key="index">
              <div class="info-header">
                <input type="text" v-model="block.title" placeholder="区块标题" />
                <button class="btn-remove-icon" @click="removeInfoBlock(index)">×</button>
              </div>
              <div class="info-content-wrapper">
                <div class="format-toolbar">
                  <button class="btn-format" @click="wrapText(index, 'quote')">🔗 引用</button>
                  <button class="btn-format" @click="wrapText(index, 'style')">✨ 样式</button>
                </div>
                <textarea :ref="(el) => setInfoTextareaRef(el, index)" v-model="block.content" rows="3"></textarea>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="code-base">
        <div class="code-header">
          <span>🛠️ 纯净 YAML 源文件映射</span>
          <span class="error-msg" v-if="yamlError">{{ yamlError }}</span>
        </div>
        <textarea class="yaml-textarea" v-model.lazy="yamlString" spellcheck="false"></textarea>
      </section>
    </div>
  </div>
</template>

<script setup>
import {ref, reactive, watch, nextTick, computed} from "vue";
import yaml from "js-yaml";
import {store} from "../store";

// 1. 初始化表单
const rawInitialData = JSON.parse(JSON.stringify(store.currentActiveEntry || {}));
const form = reactive({
  id: rawInitialData.id || "",
  name: rawInitialData.name || "",
  domain: rawInitialData.domain || "physical",
  sub_category: rawInitialData.sub_category || "",
  summary: rawInitialData.summary || "",
  tags: rawInitialData.tags || [],
  properties: rawInitialData.properties || {},
  info: rawInitialData.info || [],
  relations: rawInitialData.relations || [],
});

// 在 script setup 中找到 isNewEntry 的定义，修改为：

// 1. 定义一个标识，判断是否为“已保存的实体”
// 如果初始数据 ID 不是以 new_ entity_ 开头，说明它是个已存在的实体，不能改 ID
const isExistingEntry = !!rawInitialData.id && !rawInitialData.id.startsWith("new_entity_");

// 2. 依然保留 isNewEntry 用于其他逻辑（如判断是否需要显示一些特殊提示）
const isNewEntry = computed(() => String(form.id).startsWith("new_entity_"));
// [修复] 变量名统一为 yamlString

const yamlString = ref("");
const yamlError = ref("");

let isUpdatingFromForm = false;
let isUpdatingFromYaml = false;

// 初始化 YAML
yamlString.value = yaml.dump(JSON.parse(JSON.stringify(form)), {lineWidth: -1});

const debounce = (fn, delay = 500) => {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// 2. 同步逻辑
const syncYaml = debounce((newForm) => {
  isUpdatingFromForm = true;
  try {
    // 1. 序列化为 YAML (保持现有功能)
    const cleanData = JSON.parse(JSON.stringify(newForm));
    yamlString.value = yaml.dump(cleanData, {lineWidth: -1});

    // 2. [新增] 实时同步到 store，让 Inspector 立即感知变化
    // 我们直接更新 store 中的 activeEntry，这样 Inspector 会自动响应
    Object.assign(store.currentActiveEntry, cleanData);

    yamlError.value = "";
  } catch (error) {
    console.error("YAML 序列化失败:", error);
  } finally {
    setTimeout(() => {
      isUpdatingFromForm = false;
    }, 100);
  }
}, 300); // 防抖时间建议 300ms，这样联动感更强

const syncForm = debounce((newYaml) => {
  isUpdatingFromYaml = true;
  try {
    const parsed = yaml.load(newYaml);
    // [增强] 仅在解析为对象时处理，防止空值破坏结构
    if (parsed && typeof parsed === "object") {
      if (JSON.stringify(form) !== JSON.stringify(parsed)) {
        Object.assign(form, parsed);
      }
      yamlError.value = "";
    }
  } catch (error) {
    yamlError.value = `解析异常: ${error.message}`;
  } finally {
    setTimeout(() => {
      isUpdatingFromYaml = false;
    }, 100);
  }
}, 500);

// 3. 监听器
watch(
  form,
  (newForm) => {
    if (isUpdatingFromYaml) return;
    syncYaml(newForm);
  },
  {deep: true}
);

watch(yamlString, (newYaml) => {
  if (isUpdatingFromForm) return;
  syncForm(newYaml);
});
watch(
  () => store.currentActiveEntry,
  (newEntry) => {
    if (newEntry) {
      // 1. 深拷贝新数据到 form
      const data = JSON.parse(JSON.stringify(newEntry));
      Object.assign(form, data);

      // 2. 强制重置 YAML 字符串以匹配新实体
      yamlString.value = yaml.dump(data, {lineWidth: -1});

      // 3. 清除错误信息
      yamlError.value = "";
    }
  },
  {deep: true}
);

// 4. 工具方法保持不变
const newTagInput = ref("");
const addTag = () => {
  if (newTagInput.value.trim() && !form.tags.includes(newTagInput.value.trim())) form.tags.push(newTagInput.value.trim());
  newTagInput.value = "";
};
const removeTag = (index) => form.tags.splice(index, 1);
const addProperty = () => {
  const newKey = `new_key_${Date.now().toString().slice(-4)}`;
  form.properties[newKey] = "";
};
const removeProperty = (key) => delete form.properties[key];
const updatePropertyKey = (oldKey, newKey) => {
  const trimmed = newKey.trim();
  if (trimmed && oldKey !== trimmed) {
    form.properties[trimmed] = form.properties[oldKey];
    delete form.properties[oldKey];
  }
};
const addRelation = () => form.relations.push({target: "", type: "neutral", description: ""});
const removeRelation = (index) => form.relations.splice(index, 1);
const addInfoBlock = () => form.info.push({title: "", content: ""});
const removeInfoBlock = (index) => form.info.splice(index, 1);

const infoTextareaRefs = ref([]);
const setInfoTextareaRef = (el, index) => {
  if (el) infoTextareaRefs.value[index] = el;
};
const wrapText = async (index, type) => {
  const textarea = infoTextareaRefs.value[index];
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const content = form.info[index].content || "";
  const prefix = type === "quote" ? "[quote:id|" : "[style:令牌|";
  const selected = content.substring(start, end) || "选中文本";
  form.info[index].content = content.substring(0, start) + prefix + selected + "]" + content.substring(end);
  await nextTick();
  textarea.focus();
};

const allExistingSubCategories = computed(() => {
  const cats = new Set();
  Object.values(store.forgeData || {}).forEach((e) => {
    if (e.sub_category) cats.add(e.sub_category);
  });
  return Array.from(cats);
});

const isSaving = ref(false);
const handleSave = async () => {
  if (!form.id?.trim()) {
    alert("ID 不能为空");
    return;
  }
  if (yamlError.value) {
    alert("YAML 语法有误！");
    return;
  }

  isSaving.value = true;
  try {
    const success = await store.saveCurrentEntry(form.id, yamlString.value, JSON.parse(JSON.stringify(form)));
    if (success) store.isEditing = false;
    else throw new Error("保存失败");
  } catch (e) {
    alert(e.message);
  } finally {
    isSaving.value = false;
  }
};
</script>
<style scoped lang="scss">
.yaml-editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-main);
  .title-area {
    display: flex;
    align-items: center;
    gap: 12px;
    h3 {
      margin: 0;
      color: var(--text-main);
    }
  }
  .btn-save {
    background: var(--action-primary);
    /* 修复：移除 white，使用 bg-surface 确保对比度 */
    color: var(--bg-surface);
    border: none;
    padding: 8px 16px;
    border-radius: var(--theme-radius);
    font-weight: bold;
    cursor: pointer;
    &:disabled {
      background: var(--text-dim);
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  .btn-back {
    background: transparent;
    border: 1px solid var(--border-main);
    color: var(--text-main);
    padding: 6px 12px;
    border-radius: var(--theme-radius);
    cursor: pointer;
    margin-right: 12px;
    font-size: 0.85rem;
    &:hover {
      background: var(--action-hover);
    }
  }
}

.editor-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
}

.visual-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  input,
  select,
  textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-main);
    border-radius: var(--theme-radius);
    font-family: inherit;
    /* 确保表单文字跟随主题 */
    background: var(--bg-surface);
    color: var(--text-main);
    &:focus {
      outline: 2px solid var(--action-primary);
      border-color: transparent;
    }
  }
  .form-group label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-dim);
  }
  .complex-group {
    /* 修复：移除硬编码 rgba，使用 bg-canvas 背景配合边框实现层次 */
    background: var(--bg-canvas);
    padding: 12px;
    border-radius: var(--theme-radius);
    border: 1px dashed var(--border-main);
  }
  .btn-mini {
    background: var(--action-primary);
    color: var(--bg-surface);
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .btn-remove-icon {
    background: none;
    border: none;
    color: var(--action-danger);
    font-weight: bold;
    cursor: pointer;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    .tag-chip {
      /* 修复：标签反色处理，适应不同主题 */
      background: var(--text-main);
      color: var(--bg-surface);
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      .btn-remove-icon {
        color: var(--bg-surface);
        opacity: 0.8;
        margin-left: 6px;
      }
    }
  }
  .category-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
    .suggestion-chip {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      color: var(--text-main);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        background: var(--action-primary);
        color: var(--bg-surface);
        border-color: var(--action-primary);
      }
    }
  }
  .property-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    .property-item {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
      .prop-key,
      .prop-val {
        flex: 1;
        width: auto;
        min-width: 0;
      }
      .separator {
        flex: 0 0 auto;
        font-weight: bold;
        color: var(--text-dim);
      }
    }
  }
  .relation-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }
  .info-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
    .format-toolbar {
      display: flex;
      gap: 8px;
      .btn-format {
        background: var(--bg-surface);
        border: 1px solid var(--border-main);
        color: var(--text-main);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        &:hover {
          background: var(--action-primary);
          color: var(--bg-surface);
          border-color: var(--action-primary);
        }
      }
    }
  }
}

.code-base {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 250px;
  .code-header {
    background: var(--text-main);
    color: var(--bg-surface);
    padding: 8px 12px;
    border-radius: var(--theme-radius) var(--theme-radius) 0 0;
    font-size: 0.85rem;
    display: flex;
    justify-content: space-between;
    .error-msg {
      color: var(--status-warn);
      background: var(--bg-surface);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
  .yaml-textarea {
    flex: 1;
    width: 100%;
    background: var(--text-main);
    color: var(--bg-surface);
    font-family: var(--theme-font-family);
    padding: 12px;
    border: none;
    border-radius: 0 0 var(--theme-radius) var(--theme-radius);
  }
}
</style>
