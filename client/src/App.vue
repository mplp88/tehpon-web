<script setup lang="ts">
import LinksCard from './components/LinksCard.vue'
import GamesCard from './components/GamesCard.vue'
import UpdatesCard from './components/UpdatesCard.vue'
</script>

<template>
  <div class="relative min-h-screen pb-12 px-4 md:px-8">
    <div class="synth-grid"></div>

    <header class="flex flex-col items-center justify-center pt-8 pb-12">
      <img
        src="@/assets/logo.png"
        alt="TehPon Logo"
        class="w-32 h-32 object-contain filter drop-shadow-[0_0_25px_rgba(255,0,127,0.5)] transition-transform duration-500 hover:scale-105 rounded-full"
      />
    </header>

    <main class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <LinksCard />

      <GamesCard />

      <UpdatesCard />
    </main>
  </div>
</template>

<style scoped></style>
