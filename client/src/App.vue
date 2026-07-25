<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import LoginButton from './components/LoginButton.vue'
import LiveStatus from './components/LiveStatus.vue'

const { checkHashToken } = useAuth()

onMounted(() => {
  checkHashToken()
})

useRegisterSW()
</script>

<template>
  <div class="relative min-h-screen pb-12 px-4 md:px-8">
    <div class="synth-grid"></div>

    <!-- Top Bar Global -->
    <div class="max-w-7xl mx-auto flex justify-between items-center pt-4 px-4">
      <LiveStatus />
      <LoginButton />
    </div>

    <!-- Render dinámico según la ruta -->
    <RouterView />
  </div>
</template>

<style scoped>
.swal2-popup {
  font-family: 'Orbitron', sans-serif !important;
}
.swal2-title {
  color: var(--color-synth-cyan) !important;
  text-shadow: 0 0 10px var(--color-synth-cyan);
  letter-spacing: 0.1em;
}
</style>
