<script setup lang="ts">
import LinksCard from '@/components/LinksCard.vue'
import GamesCard from '@/components/GamesCard.vue'
import UpdatesCard from '@/components/UpdatesCard.vue'
import NowPlaying from '@/components/NowPlaying.vue'
import LiveStatus from '@/components/LiveStatus.vue'

import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import LoginButton from './components/LoginButton.vue'

const { checkHashToken } = useAuth()

onMounted(() => {
  checkHashToken()
})

useRegisterSW()
</script>

<template>
  <div class="relative min-h-screen pb-12 px-4 md:px-8">
    <div class="synth-grid"></div>

    <div class="max-w-7xl mx-auto flex justify-between items-center pt-4 px-4">
      <LiveStatus />

      <LoginButton />
    </div>

    <header class="flex flex-col items-center justify-center pt-8 pb-10">
      <img
        src="./assets/logo.png"
        alt="TehPon Logo"
        class="w-32 h-32 rounded-full object-contain filter drop-shadow-[0_0_25px_rgba(255,0,127,0.5)] transition-transform duration-500 hover:scale-105"
      />

      <p
        class="text-synth-cyan tracking-[0.3em] font-mono uppercase text-xs md:text-lg mt-4 text-center"
      >
        Streamer • Developer • Gamer
      </p>

      <div class="mt-8 max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div
          class="text-center md:text-left bg-slate-950/40 border border-synth-purple/20 p-6 rounded-xl backdrop-blur-sm shadow-[inset_0_0_10px_rgba(157,78,221,0.1)]"
        >
          <p
            class="text-slate-200 font-sans text-center text-base sm:text-lg leading-relaxed space-y-2"
          >
            <span class="block">👨‍💻 Dev de día, gamer de noche.</span>
            <span class="block">🎮 Código, juegos retro y caos perfectamente organizado.</span>
            <span class="block text-2xl mt-2 animate-flicker">☕👾</span>
          </p>
        </div>

        <NowPlaying class="mx-auto md:mx-0" />
      </div>
    </header>

    <main class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <LinksCard />

      <GamesCard />

      <UpdatesCard />
    </main>
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
