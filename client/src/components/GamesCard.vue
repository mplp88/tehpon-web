<script setup lang="ts">
import { ref } from 'vue'

const games = ref([
  { id: 1, title: 'Gravity Circuit', status: 'jugando', votes: 50 },
  { id: 2, title: 'Pokemon Red', status: 'pendiente', votes: 2 },
  { id: 3, title: 'The Darkside Detective', status: 'pendiente', votes: 7 },
  { id: 4, title: 'Sonic 1', status: 'completado', votes: 20 },
])

const voteGame = (id: number) => {
  const game = games.value.find((g) => g.id === id)
  if (game && game.status === 'pendiente') {
    game.votes++ // Simulamos el voto de manera local
    // Acá irá el POST a la API
  }
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'jugando':
      return 'bg-purple-500/20 text-purple-400 border border-purple-500/50 animate-pulse'
    case 'completado':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
    default:
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
  }
}
</script>

<template>
  <div
    class="bg-slate-900/80 backdrop-blur-md border border-synth-cyan p-6 rounded-xl shadow-neon-cyan"
  >
    <h2
      class="text-2xl font-bold text-synth-pink shadow-neon-pink mb-6 tracking-widest uppercase text-center"
    >
      Próximos Juegos & Votación
    </h2>

    <div class="space-y-4 max-h-125 overflow-y-auto pr-2 custom-scrollbar">
      <div
        v-for="game in games"
        :key="game.id"
        class="p-4 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between transition-all duration-300 hover:border-synth-purple/50"
      >
        <div>
          <h3 class="font-bold text-white text-lg">{{ game.title }}</h3>
          <span
            :class="statusBadgeClass(game.status)"
            class="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
          >
            {{ game.status }}
          </span>
        </div>

        <div class="flex items-center space-x-3">
          <span class="text-sm font-mono text-synth-cyan font-bold">{{ game.votes }} pts</span>
          <button
            @click="voteGame(game.id)"
            :disabled="game.status !== 'pendiente'"
            class="px-3 py-1.5 bg-slate-900 border border-synth-pink/60 rounded text-synth-pink text-sm font-bold transition-all duration-200 disabled:opacity-30 disabled:hover:bg-slate-900 disabled:hover:text-synth-pink disabled:hover:shadow-none hover:bg-synth-pink hover:text-slate-950 hover:shadow-neon-pink"
          >
            ▲ VOTAR
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
