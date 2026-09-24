<script setup lang="ts">
import LinksCard from '@/components/LinksCard.vue'
import CommandsCard from '@/components/CommandsCard.vue'
import GamesCard from '@/components/GamesCard.vue'
import UpdatesCard from '@/components/UpdatesCard.vue'
import NowPlaying from '@/components/NowPlaying.vue'
import logoImg from '@/assets/logo.png'

import { onMounted, ref } from 'vue'
import { useAlerts } from '@/composables/useAlerts'
import Swal from 'sweetalert2'
import axios from 'axios'
import { useAuth } from '@/composables/useAuth'
import type IGame from '@/models/game.interface'

const { showError } = useAlerts()
const { isAdmin, token } = useAuth()

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''
const games = ref<IGame[]>([])
const currentGame = ref<IGame | undefined>(undefined)
const loading = ref<boolean>(true)

const adminMenuOpen = ref(false)

const toggleAdminMenu = () => {
  adminMenuOpen.value = !adminMenuOpen.value
}

const openAddGameModal = async () => {
  const { value: title } = await Swal.fire({
    title: 'AGREGAR JUEGO',
    html:
      '<input id="swal-game-title" ' +
      'class="swal2-input bg-slate-900 border-synth-cyan text-white rounded p-2 w-full" ' +
      'placeholder="Nombre del juego">',

    focusConfirm: false,
    background: '#0b0813',

    customClass: {
      popup: 'border-2 border-synth-cyan font-mono',
      confirmButton: 'bg-synth-cyan text-slate-950 font-black px-4 py-2 rounded',
      cancelButton: 'bg-slate-700 text-white font-black px-4 py-2 rounded ml-2',
    },

    buttonsStyling: false,

    showCancelButton: true,
    cancelButtonText: 'CANCELAR',
    confirmButtonText: 'AGREGAR',

    preConfirm: () => {
      const input = Swal.getPopup()?.querySelector('#swal-game-title') as HTMLInputElement | null

      const title = input?.value.trim()

      if (!title) {
        Swal.showValidationMessage('Ingresá el nombre del juego')
        return false
      }

      return title
    },
  })

  if (!title) return

  try {
    await axios.post(
      `${API_URL}/api/games`,
      { title },
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      },
    )

    //TODO: Fix notify GamesCard to fetchGames()
    //await fetchGames()

    await Swal.fire({
      title: 'JUEGO AGREGADO',
      text: `${title} fue agregado a la lista.`,
      icon: 'success',
      background: '#0b0813',
      color: '#fff',
      confirmButtonText: 'OK',
      buttonsStyling: false,
      customClass: {
        popup: 'border-2 border-synth-cyan font-mono',
        confirmButton: 'bg-synth-cyan text-slate-950 font-black px-4 py-2 rounded',
      },
    })
  } catch (error) {
    const message = (error as any).response?.data?.message || 'Error al agregar el juego.'

    showError(message)
  }
}

const openChangeCurrentGameModal = async () => {
  const availableGames = games.value.filter((game) => game.status !== 'jugando')

  if (!availableGames.length) {
    await Swal.fire({
      title: 'SIN JUEGOS DISPONIBLES',
      text: 'No hay otros juegos para establecer como actuales.',
      icon: 'info',
      background: '#0b0813',
      color: '#fff',
      confirmButtonText: 'OK',
      buttonsStyling: false,
      customClass: {
        popup: 'border-2 border-synth-purple font-mono',
        confirmButton: 'bg-synth-purple text-white font-black px-4 py-2 rounded',
      },
    })

    return
  }

  const gamesHtml = availableGames
    .map(
      (game) => `
        <button
          type="button"
          class="game-option"
          data-game-id="${game._id}"
        >
          <span class="game-option-title">
            <i class="fa-solid fa-gamepad"></i>
            ${game.title}
          </span>

          <span class="game-option-votes">
            ${game.votedBy.length} pts
          </span>
        </button>
      `,
    )
    .join('')

  const { value: gameId } = await Swal.fire({
    title: 'CAMBIAR JUEGO ACTUAL',

    html: `
      <div class="game-selector">
        ${gamesHtml}
      </div>

      <div class="selected-game">
        <i class="fa-solid fa-circle-info"></i>
        Seleccioná un juego
      </div>
    `,

    background: '#0b0813',
    color: '#fff',

    showCancelButton: true,
    cancelButtonText: 'CANCELAR',
    confirmButtonText: 'CAMBIAR',

    buttonsStyling: false,

    customClass: {
      popup: 'border-2 border-synth-purple font-mono',
      confirmButton: 'bg-synth-purple text-white font-black px-4 py-2 rounded',
      cancelButton: 'bg-slate-700 text-white font-black px-4 py-2 rounded ml-2',
    },

    didOpen: () => {
      const popup = Swal.getPopup()

      if (!popup) return

      const buttons = popup.querySelectorAll<HTMLButtonElement>('.game-option')

      const selected = popup.querySelector('.selected-game') as HTMLElement | null

      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          buttons.forEach((b) => b.classList.remove('selected'))

          button.classList.add('selected')

          const title = button.querySelector('.game-option-title')?.textContent?.trim()

          if (selected) {
            selected.innerHTML = `
              <i class="fa-solid fa-check"></i>
              ${title}
            `
          }

          popup.dataset.selectedGame = button.dataset.gameId ?? ''
        })
      })
    },

    preConfirm: () => {
      const popup = Swal.getPopup()

      const selectedGame = popup?.dataset.selectedGame

      if (!selectedGame) {
        Swal.showValidationMessage('Seleccioná un juego para continuar')

        return false
      }

      return selectedGame
    },
  })

  if (!gameId) return

  const selectedGame = games.value.find((game) => game._id === gameId)

  try {
    await axios.patch(`${API_URL}/api/games/${gameId}/current`, null, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    await fetchGames()
    await getCurrentGame()

    await Swal.fire({
      title: 'JUEGO ACTUALIZADO',
      text: `${selectedGame?.title ?? 'El juego'} ahora es el juego actual.`,
      icon: 'success',
      background: '#0b0813',
      color: '#fff',
      confirmButtonText: 'OK',
      buttonsStyling: false,
      customClass: {
        popup: 'border-2 border-synth-purple font-mono',
        confirmButton: 'bg-synth-purple text-white font-black px-4 py-2 rounded',
      },
    })
  } catch (error) {
    const message = (error as any).response?.data?.message || 'Error al cambiar el juego actual.'

    showError(message)
  }
}

const sortGames = (rawGames: IGame[]) => {
  const games = rawGames.sort((a: IGame, b: IGame) => {
    if (a.status === 'jugando') return -1
    if (b.status === 'jugando') return 1
    return (b.votedBy?.length || 0) - (a.votedBy?.length || 0)
  })
  return games
}

const fetchGames = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/games`)
    const rawGames = res.data

    games.value = sortGames(rawGames)
  } catch (error) {
    showError((error as any).message)
    console.error(error)
  } finally {
    loading.value = false
  }
}

const updateGameStatus = (data: IGame) => {
  const index = games.value.findIndex((g: IGame) => g._id === data._id)
  if (index !== -1) {
    games.value[index] = data
    games.value = sortGames(games.value)
  }
}

const getCurrentGame = async () => {
  const { data } = await axios.get(`${API_URL}/api/games/current-game`)
  currentGame.value = data
}

onMounted(async () => {
  await fetchGames()
  setInterval(
    async () => {
      await fetchGames()
    },
    5 * 60 * 1000,
  )

  await getCurrentGame()
})
</script>

<template>
  <div>
    <!-- Header exacto de la Home original -->
    <header class="flex flex-col items-center justify-center pt-8 pb-10">
      <img
        :src="logoImg"
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

        <NowPlaying class="mx-auto md:mx-0" :currentGame="currentGame" />
      </div>
    </header>

    <!-- Main Grid exacto de 3 columnas para Desktop -->
    <main class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <LinksCard />
      <GamesCard :games="games" :loading="loading" @update-game-status="updateGameStatus" />
      <CommandsCard />
      <UpdatesCard class="lg:col-span-3" />
    </main>

    <!-- Admin Floating Menu -->
    <div v-if="isAdmin" class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <!-- Menu -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
      >
        <div v-if="adminMenuOpen" class="flex flex-col items-end gap-3">
          <!-- Agregar juego -->
          <button
            type="button"
            @click="openAddGameModal"
            class="flex items-center gap-3 px-4 py-2.5 bg-slate-950/95 border border-synth-cyan text-synth-cyan rounded-lg font-mono font-bold text-sm shadow-neon-cyan hover:bg-synth-cyan hover:text-slate-950 transition-all duration-200"
          >
            <span>AGREGAR JUEGO</span>
            <i class="fa-solid fa-gamepad"></i>
          </button>

          <!-- Cambiar juego actual -->
          <button
            type="button"
            @click="openChangeCurrentGameModal"
            class="flex items-center gap-3 px-4 py-2.5 bg-slate-950/95 border border-synth-purple text-synth-purple rounded-lg font-mono font-bold text-sm shadow-neon-purple hover:bg-synth-purple hover:text-white transition-all duration-200"
          >
            <span>CAMBIAR JUEGO ACTUAL</span>
            <i class="fa-solid fa-rotate"></i>
          </button>
        </div>
      </Transition>

      <!-- Main FAB -->
      <button
        type="button"
        @click="toggleAdminMenu"
        :aria-label="adminMenuOpen ? 'Cerrar menú' : 'Administrar juegos'"
        :aria-expanded="adminMenuOpen"
        class="w-14 h-14 flex items-center justify-center rounded-full bg-slate-950 border-2 border-synth-pink text-synth-pink shadow-neon-pink hover:bg-synth-pink hover:text-slate-950 transition-all duration-200"
      >
        <i :class="['fa-solid', adminMenuOpen ? 'fa-times' : 'fa-plus', 'text-xl']"></i>
      </button>
    </div>
  </div>
</template>

<style>
.game-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.25rem;
}

.game-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0.75rem 1rem;

  background: rgb(2 6 23 / 0.9);
  border: 1px solid rgb(71 85 105 / 0.8);
  border-radius: 0.5rem;

  color: white;

  font-family: monospace;
  font-weight: bold;

  cursor: pointer;

  transition: all 0.2s ease;
}

.game-option:hover {
  border-color: rgb(192 132 252);
  background: rgb(168 85 247 / 0.1);
}

.game-option.selected {
  border-color: rgb(168 85 247);
  background: rgb(168 85 247 / 0.2);
  box-shadow: 0 0 12px rgb(168 85 247 / 0.25);
}

.game-option-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.game-option-title i {
  color: rgb(34 211 238);
}

.game-option-votes {
  color: rgb(34 211 238);
  font-size: 0.8rem;
}

.selected-game {
  margin-top: 1rem;

  padding: 0.6rem;

  border: 1px dashed rgb(168 85 247 / 0.5);
  border-radius: 0.5rem;

  color: rgb(192 132 252);

  font-family: monospace;
  font-size: 0.8rem;
}

.selected-game i {
  margin-right: 0.4rem;
}
</style>
