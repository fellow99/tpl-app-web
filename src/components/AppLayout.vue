<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="app-header-inner">
        <h1 class="brand">{{ $t('app.name') }}</h1>
        <nav class="header-nav">
          <LangSwitcher />
          <router-link to="/profile" class="btn btn-ghost logout-btn" :aria-label="$t('auth.profile.title')">
            <User :size="18" />
            <span>{{ $t('auth.profile.title') }}</span>
          </router-link>
          <button class="btn btn-ghost logout-btn" @click="handleLogout" :aria-label="$t('auth.profile.logout')">
            <LogOut :size="18" />
            <span>{{ $t('auth.profile.logout') }}</span>
          </button>
        </nav>
      </div>
    </header>
    <main class="app-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { LogOut, User } from 'lucide-vue-next'
import LangSwitcher from '@/components/LangSwitcher.vue'

const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--white);
  border-bottom: 1px solid var(--silver);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  font-size: 17px;
  font-weight: 600;
  color: var(--indigo);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.logout-btn {
  height: 36px;
  font-size: 13px;
  padding: 0 var(--space-md);
}

.app-content {
  flex: 1;
  padding: var(--space-xl) var(--space-lg);
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 640px) {
  .app-content {
    padding: var(--space-lg);
  }
}
</style>
