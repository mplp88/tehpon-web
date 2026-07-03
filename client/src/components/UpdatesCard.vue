<script setup lang="ts">
const updates = [
  {
    id: 1,
    date: '01 JUL 2026',
    title: '¡Estrenamos la Web Oficial!',
    body: 'Bienvenidos a mi rincón gamer. Desde acá van a poder votar qué jugamos en los próximos streams.',
  },
]
</script>

<template>
  <div
    class="bg-slate-900/80 backdrop-blur-md border border-synth-purple p-6 rounded-xl shadow-neon-purple"
  >
    <h2
      class="text-2xl font-bold text-synth-cyan shadow-neon-cyan mb-6 tracking-widest uppercase text-center animate-flicker py-3"
    >
      Últimas Novedades
    </h2>

    <div class="space-y-4 max-h-125 overflow-y-auto pr-2 custom-scrollbar">
      <div
        v-for="update in updates"
        :key="update.id"
        class="border-l-2 border-synth-pink pl-4 py-1"
      >
        <span class="text-xs font-mono text-slate-400">{{ update.date }}</span>
        <h3 class="font-bold text-white text-base mt-0.5">{{ update.title }}</h3>
        <p class="text-sm text-slate-300 mt-1 leading-relaxed">{{ update.body }}</p>
      </div>
    </div>
  </div>
</template>
