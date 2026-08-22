<template>
  <div class="lang-switcher" ref="container">
    <button
      class="lang-btn"
      :title="currentLabel"
      aria-label="Switch language"
      @click.stop="toggle"
    >
      🌐
    </button>
    <Transition name="dropdown">
      <div v-if="open" class="lang-dropdown" @click.stop>
        <div class="lang-dropdown-arrow"></div>
        <div
          v-for="opt in LANG_OPTIONS"
          :key="opt.value"
          class="lang-dropdown-item"
          :class="{ active: locale === opt.value }"
          @click="select(opt.value)"
        >
          {{ opt.label }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage, LANG_OPTIONS, type Locale } from '@/lang'

const { locale } = useI18n()
const open = ref(false)
const container = ref<HTMLElement | null>(null)

const currentLabel = computed(() => LANG_OPTIONS.find((o) => o.value === locale.value)?.label ?? '')

function toggle() {
  open.value = !open.value
}

function select(lang: Locale) {
  setLanguage(lang)
  open.value = false
}

function onDocumentClick(e: MouseEvent) {
  if (container.value && !container.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<style scoped>
.lang-switcher {
  position: relative;
}

.lang-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--silver);
  background: transparent;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 150ms var(--ease-out), border-color 150ms var(--ease-out);
}

.lang-btn:hover {
  background: var(--frost);
  border-color: var(--indigo);
}

/* el-dropdown 风格下拉面板 */
.lang-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 120px;
  background: var(--white);
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 5px 0;
  z-index: 2000;
}

.lang-dropdown-arrow {
  position: absolute;
  top: -5px;
  right: 12px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid var(--white);
}

.lang-dropdown-item {
  padding: 0 16px;
  height: 34px;
  line-height: 34px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
  white-space: nowrap;
  transition: background 100ms var(--ease-out);
}

.lang-dropdown-item:hover {
  background: var(--frost);
}

.lang-dropdown-item.active {
  color: var(--indigo);
  font-weight: 500;
}

/* 过渡动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 120ms var(--ease-out), transform 120ms var(--ease-out);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>