<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAlerts } from '@/composables/useAlerts'
import axios from 'axios'

interface IGame {
  _id: number
  title: string
  status: string
  votedBy: string[]
}

const { token, triggerAlert, user } = useAuth()
const { showError, showVoteRemoved, showVoteSuccess } = useAlerts()

const games = ref<IGame[]>([])
const loading = ref(true)

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''

const fetchGames = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/games`)
    const rawGames = res.data

    games.value = rawGames.sort((a: IGame, b: IGame) => {
      if (a.status === 'jugando') return -1
      if (b.status === 'jugando') return 1
      return (b.votedBy?.length || 0) - (a.votedBy?.length || 0)
    })
  } catch (error) {
    showError((error as any).message)
    console.error(error)
  } finally {
    loading.value = false
  }
}

const voteGame = async (id: number) => {
  if (!token.value) {
    triggerAlert()
    return
  }

  try {
    const { data } = await axios.post(`${API_URL}/api/games/${id}/vote`, null, {
      headers: { Authorization: `Bearer ${token.value}` },
    })

    // Si sale todo bien, actualizamos el juego específico en el cliente para no recargar toda la lista
    const index = games.value.findIndex((g) => g._id === id)
    if (index !== -1) {
      games.value[index] = data.game
    }

    if (data.action === 'vote') {
      showVoteSuccess()
    } else {
      showVoteRemoved()
    }
  } catch (err) {
    const errMsg = (err as any).response?.data?.message || 'Error al procesar el voto.'
    showError(errMsg)
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

const hasUserVoted = (game: IGame) => {
  if (!user.value || !game.votedBy) return false
  return game.votedBy.includes(user.value.id)
}

const getButtonText = (game: IGame) => {
  if (game.status !== 'pendiente') return 'CERRADO'
  return hasUserVoted(game) ? 'RETIRAR' : 'VOTAR'
}
const getButtonClassName = (game: IGame) => {
  const baseClass = 'px-3 py-1.5 rounded text-sm font-mono font-bold transition-all duration-200 '

  if (game.status !== 'pendiente') {
    return (
      baseClass +
      'opacity-30 cursor-not-allowed bg-slate-900 border border-slate-700 text-slate-500'
    )
  }

  if (hasUserVoted(game)) {
    return (
      baseClass +
      'bg-slate-900 border border-synth-purple text-synth-purple hover:bg-synth-purple hover:text-white hover:shadow-neon-purple'
    )
  } else {
    return (
      baseClass +
      'bg-slate-900 border border-synth-pink/60 text-synth-pink hover:bg-synth-pink hover:text-slate-950 hover:shadow-neon-pink'
    )
  }
}

onMounted(() => {
  fetchGames()
})
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
      <div v-if="loading" class="text-center py-8 text-synth-purple animate-pulse font-mono">
        ⏳ Sincronizando grilla de datos...
      </div>
      <div
        v-else
        v-for="game in games"
        :key="game._id"
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
          <span class="text-sm font-mono text-synth-cyan font-bold"
            >{{ game.votedBy.length }} pts</span
          >
          <button
            @click="voteGame(game._id)"
            :disabled="game.status !== 'pendiente'"
            :class="getButtonClassName(game)"
          >
            {{ getButtonText(game) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
