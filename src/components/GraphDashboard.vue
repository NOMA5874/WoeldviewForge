<template>
  <div class="dashboard-wrapper">
    <div class="toolbar">
      <button :class="{active: viewMode === 'global'}" @click="switchView('global')">全局预览</button>
      <button :class="{active: viewMode === 'char'}" @click="switchView('char')">人物关系一览</button>
    </div>
    <div ref="cyRef" class="cy-container"></div>
  </div>
</template>

<script setup>
import {ref, nextTick, onMounted, onBeforeUnmount, watch} from "vue";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import {store} from "../store";

cytoscape.use(fcose);

const cyRef = ref(null);
const viewMode = ref("global");
let cy = null;

const getComputedColor = (varName) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
const getNodeColor = (domain) => getComputedColor(domain === "conceptual" ? "--accent-conceptual" : "--accent-physical");

// 1. 全局布局逻辑
const applyGlobalLayout = () => {
  cy.layout({
    name: "fcose",
    animate: true,
    animationDuration: 500,
    nodeRepulsion: 10000,
    idealEdgeLength: 150,
    edgeElasticity: 0.45,
    gravity: 0.25,
    gravityRange: 3.8,
    numIter: 2500,
    nodeSeparation: 100,
    tile: false,
    fit: true,
    padding: 50,
  }).run();
};

// 2. 局部聚焦布局逻辑 (以点击节点为中心)
const applyLocalLayout = (targetNode) => {
  const neighborhood = targetNode.neighborhood().add(targetNode);

  neighborhood
    .layout({
      name: "concentric",
      fit: false,
      animate: true,
      animationDuration: 400,
      // 强制目标节点在圆心
      concentric: (node) => (node.id() === targetNode.id() ? 2 : 1),
      levelWidth: () => 1,
      minNodeSpacing: 60,
      padding: 20,
    })
    .run();
};

const switchView = (mode) => {
  viewMode.value = mode;
  renderGraph();
};

const renderGraph = () => {
  if (!cyRef.value) return;
  if (cy) cy.destroy();

  const nodes = [];
  const edges = [];

  Object.values(store.forgeData).forEach((e) => {
    if (viewMode.value === "char" && e.sub_category !== "character") return;
    nodes.push({data: {id: e.id, label: e.name || e.id, domain: e.domain || "physical"}});

    if (viewMode.value === "global") {
      const content = e.info?.map((i) => i.content).join(" ") || "";
      const regex = /\[.*?:(.*?)\|.*?\]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (store.forgeData[match[1]]) edges.push({data: {source: e.id, target: match[1], type: "reference"}});
      }
    } else if (viewMode.value === "char" && e.sub_category === "character" && e.relations) {
      e.relations.forEach((r) => {
        if (store.forgeData[r.target]) {
          edges.push({data: {source: e.id, target: r.target, type: r.type, label: r.description}});
        }
      });
    }
  });

  cy = cytoscape({
    container: cyRef.value,
    elements: {nodes, edges},
    style: [
      {
        selector: "node",
        style: {
          "background-color": (ele) => getNodeColor(ele.data("domain")),
          color: getComputedColor("--text-main"),
          label: "data(label)",
          width: 20,
          height: 20,
          "font-size": 11,
          "text-valign": "top",
          "text-margin-y": -10,
          "text-background-color": getComputedColor("--bg-surface"),
          "text-background-opacity": 0.7,
          "text-background-padding": 2,
          "text-background-shape": "roundrectangle",
        },
      },
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
          "control-point-step-size": 80,
          width: 2,
          "line-color": getComputedColor("--text-dim"),
          "target-arrow-color": getComputedColor("--text-dim"),
          "target-arrow-shape": "triangle",
          label: "data(label)",
          "font-size": 10,
          color: getComputedColor("--text-main"),
          "text-background-color": getComputedColor("--bg-surface"),
          "text-background-opacity": 0.8,
        },
      },
      {selector: "node.faded", style: {opacity: 0.15}},
      {selector: "edge.faded", style: {opacity: 0.05, "edge-text-opacity": 0}},
      {selector: "node.highlighted", style: {opacity: 1, "border-width": 3, "border-color": getComputedColor("--text-main")}},
      {selector: "edge:selected, edge.highlighted", style: {"edge-text-opacity": 1, width: 3}},
      {selector: 'edge[type="hostile"]', style: {"line-color": getComputedColor("--status-warn"), "target-arrow-color": getComputedColor("--status-warn")}},
      {selector: 'edge[type="friendly"]', style: {"line-color": getComputedColor("--status-success"), "target-arrow-color": getComputedColor("--status-success")}},
      {selector: 'edge[type="neutral"]', style: {"line-color": getComputedColor("--status-info"), "target-arrow-color": getComputedColor("--status-info")}},
    ],
  });

  // 交互事件
  cy.on("mouseover", "node", (e) => {
    cy.elements().addClass("faded");
    e.target.removeClass("faded").addClass("highlighted").neighborhood().removeClass("faded");
  });

  cy.on("mouseout", "node", () => cy.elements().removeClass("faded highlighted"));

  // 点击节点：局部聚焦
  cy.on("tap", "node", (evt) => {
    store.currentActiveEntry = store.forgeData[evt.target.id()];
    applyLocalLayout(evt.target);
  });

  // 点击空白：恢复全局
  cy.on("tap", (evt) => {
    if (evt.target === cy) applyGlobalLayout();
  });

  applyGlobalLayout();
};

watch(
  () => store.forgeData,
  (newData) => {
    // 只有当有数据时才渲染
    if (newData && Object.keys(newData).length > 0) {
      renderGraph();
    }
  },
  {deep: true, immediate: false} // 避免重复触发，交给 onMounted 处理初始
);

onMounted(async () => {
  await nextTick();
  // 检查是否已有数据（如果是缓存或同步加载情况）
  if (Object.keys(store.forgeData).length > 0) {
    renderGraph();
  }
});
onBeforeUnmount(() => cy?.destroy());
</script>

<style scoped lang="scss">
/* 保持原样式不变 */
.dashboard-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}
.toolbar {
  display: flex;
  gap: 8px;
  padding: 4px;
  button {
    padding: 6px 14px;
    border: 1px solid var(--border-main);
    background: var(--bg-surface);
    color: var(--text-dim);
    border-radius: var(--theme-radius);
    cursor: pointer;
    transition: all 0.2s;
    &.active {
      background: var(--action-primary);
      color: white;
      font-weight: 600;
    }
  }
}
.cy-container {
  flex: 1;
  width: 100%;
  border: 1px solid var(--border-main);
  border-radius: var(--theme-radius);
  background: var(--bg-surface);
  overflow: hidden;
}
</style>
