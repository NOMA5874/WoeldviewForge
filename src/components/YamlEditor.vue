<template>
  <div class="yaml-editor-container">
    <header class="editor-header">
      <div class="title-area">
        <button class="btn-back" @click="store.isEditing = false">← 返回看板</button>
        <h3>编辑实体: {{ store.currentActiveEntry?.id }}</h3>
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
            <input type="text" v-model="form.id" :disabled="!isNewEntry" placeholder="不可变标识" />
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

        <!-- 标签阵列区 (Tags) -->
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

        <!-- 静态属性池 (Properties: 动态键值对) -->
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
            <div v-if="!form.properties || Object.keys(form.properties).length === 0" class="empty-hint">暂无私有属性</div>
          </div>
        </div>

        <!-- 关系网络 (Relationships) -->
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
            <div v-if="!form.relations || form.relations.length === 0" class="empty-hint">暂无关联关系</div>
          </div>
        </div>

        <!-- 动态详情列表 (Info Blocks) -->
        <div class="form-group complex-group">
          <label class="group-header">
            动态详情列 (Info)
            <button class="btn-mini" @click="addInfoBlock">+ 添加文本块</button>
          </label>
          <div class="info-list">
            <div class="info-item" v-for="(block, index) in form.info" :key="index">
              <div class="info-header">
                <input type="text" v-model="block.title" placeholder="区块标题 (如: 生平经历)" />
                <button class="btn-remove-icon" @click="removeInfoBlock(index)">×</button>
              </div>

              <!-- [契约升级] 新增快捷格式化工具栏与关联的 ref -->
              <div class="info-content-wrapper">
                <div class="format-toolbar">
                  <button class="btn-format" @click="wrapText(index, 'quote')" title="快捷插入引用">🔗 引用 [quote]</button>
                  <button class="btn-format" @click="wrapText(index, 'style')" title="快捷插入样式">✨ 样式 [style]</button>
                </div>
                <textarea :ref="(el) => setInfoTextareaRef(el, index)" v-model="block.content" rows="3" placeholder="选中文本后点击上方按钮，或直接输入 [类型:参数|显示文本] 行内标记..."></textarea>
              </div>
            </div>
            <div v-if="!form.info || form.info.length === 0" class="empty-hint">暂无详情区块</div>
          </div>
        </div>
      </section>

      <!-- 下半部分：YAML 纯净代码底座 (Raw Source) -->
      <section class="code-base">
        <div class="code-header">
          <span>🛠️ 纯净 YAML 源文件映射</span>
          <span class="error-msg" v-if="yamlError">{{ yamlError }}</span>
        </div>
        <textarea class="yaml-textarea" v-model="rawYamlString" spellcheck="false"></textarea>
      </section>
    </div>
  </div>
</template>

<script setup>
import {ref, reactive, watch, computed, nextTick} from "vue";
import yaml from "js-yaml";
import {store} from "../store";

// 1. 初始化表单状态 (深拷贝隔离)
const rawInitialData = JSON.parse(JSON.stringify(store.currentActiveEntry));
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

const isNewEntry = computed(() => String(form.id).startsWith("new_entity_"));

// 2. 双向同步引擎状态
const rawYamlString = ref("");
const yamlError = ref("");
let isUpdatingFromForm = false;
let isUpdatingFromYaml = false;

// 初始序列化一次
rawYamlString.value = yaml.dump(JSON.parse(JSON.stringify(form)), {lineWidth: -1});

watch(
  form,
  (newForm) => {
    if (isUpdatingFromYaml) return;
    isUpdatingFromForm = true;
    try {
      const pureObject = JSON.parse(JSON.stringify(newForm));
      rawYamlString.value = yaml.dump(pureObject, {lineWidth: -1});
      yamlError.value = "";
    } catch (error) {
      console.error("YAML 序列化失败:", error);
    }
    Promise.resolve().then(() => {
      isUpdatingFromForm = false;
    });
  },
  {deep: true}
);

watch(rawYamlString, (newYaml) => {
  if (isUpdatingFromForm) return;
  isUpdatingFromYaml = true;
  try {
    const parsed = yaml.load(newYaml);
    if (parsed && typeof parsed === "object") {
      form.id = parsed.id || "";
      form.name = parsed.name || "";
      form.domain = parsed.domain || "physical";
      form.sub_category = parsed.sub_category || "";
      form.summary = parsed.summary || "";
      form.tags = parsed.tags || [];
      form.properties = parsed.properties || {};
      form.info = parsed.info || [];
      form.relations = parsed.relations || [];
      yamlError.value = "";
    }
  } catch (error) {
    yamlError.value = `解析异常: ${error.message}`;
  }
  Promise.resolve().then(() => {
    isUpdatingFromYaml = false;
  });
});

// 3. 表单快捷交互方法
const newTagInput = ref("");
const addTag = () => {
  const val = newTagInput.value.trim();
  if (val && !form.tags.includes(val)) {
    form.tags.push(val);
  }
  newTagInput.value = "";
};
const removeTag = (index) => form.tags.splice(index, 1);

const addProperty = () => {
  const newKey = `new_key_${Date.now().toString().slice(-4)}`;
  form.properties[newKey] = "";
};
const removeProperty = (key) => delete form.properties[key];
const updatePropertyKey = (oldKey, newKey) => {
  const trimmedNewKey = newKey.trim();
  if (!trimmedNewKey || oldKey === trimmedNewKey) return;
  form.properties[trimmedNewKey] = form.properties[oldKey];
  delete form.properties[oldKey];
};

const addRelation = () => {
  form.relations.push({target: "", type: "neutral", description: ""});
};
const removeRelation = (index) => form.relations.splice(index, 1);

const addInfoBlock = () => form.info.push({title: "", content: ""});
const removeInfoBlock = (index) => form.info.splice(index, 1);

const allExistingSubCategories = computed(() => {
  const categories = new Set();
  Object.values(store.forgeData).forEach((item) => {
    if (item.sub_category) categories.add(item.sub_category);
  });
  return Array.from(categories).sort();
});

// --- [契约升级] 快捷文本包裹核心逻辑 ---
const infoTextareaRefs = ref([]);
// 收集模板中 v-for 渲染的 textarea DOM 实例
const setInfoTextareaRef = (el, index) => {
  if (el) {
    infoTextareaRefs.value[index] = el;
  }
};

const wrapText = async (index, type) => {
  const textarea = infoTextareaRefs.value[index];
  if (!textarea) return;

  const startPos = textarea.selectionStart;
  const endPos = textarea.selectionEnd;
  const currentContent = form.info[index].content || "";

  // 1. 提取选中文本（如果没有选中，则提供缺省词汇）
  const selectedText = currentContent.substring(startPos, endPos) || "选中文本";

  // 2. 准备包裹标记和需要高亮的引导参数
  let prefix = "";
  let placeholder = "";

  if (type === "quote") {
    prefix = "[quote:";
    placeholder = "id";
  } else if (type === "style") {
    prefix = "[style:";
    placeholder = "令牌";
  }
  const suffix = `|${selectedText}]`;

  // 3. 拼接新字符串并更新双向绑定
  const newText = currentContent.substring(0, startPos) + prefix + placeholder + suffix + currentContent.substring(endPos);
  form.info[index].content = newText;

  // 4. 等待 Vue 完成 DOM 渲染更新
  await nextTick();

  // 5. 计算 placeholder (id 或 令牌) 在新字符串中的准确坐标
  const cursorStart = startPos + prefix.length;
  const cursorEnd = cursorStart + placeholder.length;

  // 6. 重新聚焦并将光标选中 placeholder 区域
  textarea.focus();
  textarea.setSelectionRange(cursorStart, cursorEnd);
};
// ----------------------------------------

// 4. 落盘保存交互
const isSaving = ref(false);
const handleSave = async () => {
  if (typeof form.id !== "string") {
    alert("检测到 ID 数据异常，请联系开发者。");
    return;
  }
  if (yamlError.value) {
    alert("YAML 语法存在错误，请在底座编辑器中修正后再保存！");
    return;
  }
  if (!form.id.trim()) {
    alert("唯一标识 (ID) 不能为空！");
    return;
  }

  isSaving.value = true;
  try {
    const payload = JSON.parse(JSON.stringify(form));
    const success = store.saveCurrentEntry(id, yamlString, fullData);

    if (success) {
      store.forgeData[payload.id] = payload;
      store.currentActiveEntry = store.forgeData[payload.id];
      store.notifyUpdate();
      store.isEditing = false;
    } else {
      throw new Error("后端保存请求未返回成功，请检查服务器日志");
    }
  } catch (error) {
    console.error("保存失败:", error);
    alert(`保存失败: ${error.message}`);
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
      /* 修复：移除 white */
      background: var(--bg-surface);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
  .yaml-textarea {
    flex: 1;
    width: 100%;
    /* 修复：移除 #1e1e1e，使用 canvas 背景，适配所有主题 */
    background: var(--bg-canvas);
    /* 修复：移除 #d4d4d4，使用 text-main 确保文字清晰 */
    color: var(--text-main);
    font-family: var(--theme-font-family);
    padding: 12px;
    border: none;
    border-radius: 0 0 var(--theme-radius) var(--theme-radius);
  }
}
</style>
