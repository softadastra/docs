<script setup>
import { computed, ref, watch } from "vue";
import CodeBlock from "./CodeBlock.vue";

const props = defineProps({
  title:      { type: String, default: "Examples" },
  subtitle:   { type: String, default: "" },
  examples:   { type: Array,  required: true },
  defaultKey: { type: String, default: "" },
});

const active = ref(props.defaultKey || (props.examples?.[0]?.key ?? ""));

watch(
  () => [props.defaultKey, props.examples?.map(e => e.key).join("|")].join("::"),
  () => {
    const wanted = props.defaultKey || active.value;
    const exists = props.examples?.some(e => e.key === wanted);
    active.value = exists ? wanted : (props.examples?.[0]?.key ?? "");
  },
  { immediate: true }
);

const current = computed(() =>
  props.examples.find(e => e.key === active.value) || props.examples[0] || null
);

function setTab(key) { active.value = key; }

function onTabsKeydown(e) {
  const keys = props.examples?.map(x => x.key) ?? [];
  if (!keys.length) return;
  const idx = Math.max(0, keys.indexOf(active.value));
  let next = idx;
  if (e.key === "ArrowRight") next = (idx + 1) % keys.length;
  else if (e.key === "ArrowLeft") next = (idx - 1 + keys.length) % keys.length;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = keys.length - 1;
  else return;
  e.preventDefault();
  active.value = keys[next];
  e.currentTarget?.querySelector?.(`button[data-key="${active.value}"]`)?.focus?.();
}
</script>

<template>
  <div class="ct">
    <!-- Header -->
    <div class="ct-head">
      <div class="ct-meta">
        <div class="ct-title">{{ title }}</div>
        <div v-if="subtitle" class="ct-sub">{{ subtitle }}</div>
      </div>

      <div class="ct-tabs" role="tablist" aria-label="Code examples" @keydown="onTabsKeydown">
        <button
          v-for="ex in examples"
          :key="ex.key"
          class="ct-tab"
          :class="{ 'ct-tab--active': ex.key === active }"
          :aria-selected="ex.key === active"
          :tabindex="ex.key === active ? 0 : -1"
          role="tab"
          type="button"
          :data-key="ex.key"
          @click="setTab(ex.key)"
        >{{ ex.label }}</button>
      </div>
    </div>

    <!-- File badge -->
    <div class="ct-body">
      <div class="ct-file" v-if="current?.file">
        <span class="ct-lang-badge">{{ current.lang || "txt" }}</span>
        <span class="ct-filename">{{ current.file }}</span>
      </div>

      <CodeBlock
        :title="current?.title || current?.file || current?.label || ''"
        :lang="current?.lang || ''"
        :chips="Array.isArray(current?.chips) ? current.chips : []"
        :code="current?.code || ''"
        :run="current?.run || ''"
        :out="current?.out || ''"
        :note="current?.note || ''"
        :maxHeight="440"
      />
    </div>
  </div>
</template>
<style>
/* ============================================================
   Softadastra CodeTabs
   ============================================================ */

.cb {
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 14px;
  background: #0f151b;
  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.035);
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
}

html:not(.dark) .cb {
  border-color: rgba(0, 0, 0, 0.12);
  background: #151a22;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
}

/* Header */
.cb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 44px;
  padding: 9px 12px;
  background: #151d24;
  border-bottom: 1px solid rgba(255, 255, 255, 0.075);
}

html:not(.dark) .cb-head {
  background: #1c232d;
  border-bottom-color: rgba(255, 255, 255, 0.09);
}

.cb-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cb-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cb-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.cb-dot--r {
  background: #ff7a59;
}

.cb-dot--y {
  background: #ffd166;
}

.cb-dot--g {
  background: #7c8cff;
}

.cb-title {
  color: rgba(220, 234, 245, 0.72);
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.cb-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  color: #aeb9ff;
  background: rgba(174, 185, 255, 0.09);
  border: 1px solid rgba(174, 185, 255, 0.22);
  border-radius: 999px;
  font-size: 0.67rem;
  font-weight: 750;
}

/* Tabs */
.cb-tabs {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 999px;
}

.cb-tab {
  padding: 4px 10px;
  color: rgba(220, 234, 245, 0.58);
  background: transparent;
  border: 0;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 650;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}

.cb-tab:hover {
  color: rgba(255, 255, 255, 0.9);
}

.cb-tab--active {
  color: #ffffff;
  background: rgba(174, 185, 255, 0.16);
}

/* Copy */
.cb-copy {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: rgba(220, 234, 245, 0.66);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.14s ease,
    background 0.12s ease,
    color 0.12s ease,
    border-color 0.12s ease,
    transform 0.1s ease;
}

.cb-copy--visible {
  opacity: 1;
  pointer-events: auto;
}

.cb-copy:hover {
  color: #ffffff;
  background: rgba(174, 185, 255, 0.15);
  border-color: rgba(174, 185, 255, 0.3);
  transform: translateY(-1px);
}

.cb-ico {
  display: block;
  width: 15px;
  height: 15px;
}

/* Body */
.cb-body {
  overflow: auto;
  background: #0f151b;
  -webkit-overflow-scrolling: touch;
}

html:not(.dark) .cb-body {
  background: #151a22;
}

.cb-pre {
  min-width: max-content;
  margin: 0;
  padding: 15px 17px;
  color: #d7e2ee;
  background: transparent;
  font-size: 0.875rem;
  line-height: 1.72;
  white-space: pre;
}

.cb-code {
  display: inline-block;
  min-width: 100%;
}

/* Scrollbars */
.cb-body {
  scrollbar-width: thin;
  scrollbar-color: rgba(174, 185, 255, 0.35) rgba(0, 0, 0, 0.18);
}

.cb-body::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.cb-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.18);
}

.cb-body::-webkit-scrollbar-thumb {
  background: rgba(174, 185, 255, 0.34);
  border-radius: 999px;
}

.cb-body::-webkit-scrollbar-thumb:hover {
  background: rgba(174, 185, 255, 0.58);
}

/* Footer */
.cb-foot {
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.18);
  border-top: 1px solid rgba(255, 255, 255, 0.065);
}

.cb-note {
  margin: 0;
  color: rgba(220, 234, 245, 0.55);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.82rem;
  line-height: 1.55;
}

/* ============================================================
   Syntax colors, Softadastra theme
   ============================================================ */

/* Preprocessor */
.cb-kw-dir {
  color: #c792ea;
}

.cb-kw-inc {
  color: #ecc48d;
}

/* C++ core */
.cb-kw {
  color: #82aaff;
  font-weight: 650;
}

.cb-type {
  color: #7fdbca;
}

.cb-ns {
  color: #89ddff;
}

.cb-fn {
  color: #ffcb8b;
}

.cb-mem {
  color: #addbff;
}

.cb-id {
  color: #d7e2ee;
}

.cb-str {
  color: #c3e88d;
}

.cb-char {
  color: #f78c6c;
}

.cb-num {
  color: #f78c6c;
}

.cb-comment {
  color: #6f8293;
  font-style: italic;
}

.cb-op {
  color: rgba(215, 226, 238, 0.5);
}

.cb-url {
  color: #89ddff;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Shell */
.cb-sh-prompt {
  color: #aeb9ff;
  font-weight: 800;
}

.cb-sh-cmd {
  color: #89ddff;
  font-weight: 750;
}

.cb-sh-flag {
  color: #ffcb8b;
}

.cb-sh-path {
  color: #c792ea;
}

.cb-sh-url {
  color: #89ddff;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.cb-sh-port {
  color: #f78c6c;
}

.cb-sh-http {
  color: #c3e88d;
  font-weight: 750;
}

/* Responsive */
@media (max-width: 640px) {
  .cb-pre {
    padding: 12px;
    font-size: 0.82rem;
  }

  .cb-title {
    max-width: 28vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cb-chip {
    display: none;
  }
}
</style>
