<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

interface IGame {
  title: string
}

const currentGame = ref<IGame>({ title: '' })

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''

const getCurrentGame = async () => {
  const { data } = await axios.get(`${API_URL}/api/games/current-game`)
  currentGame.value = data
}

onMounted(async () => {
  await getCurrentGame()
  console.log(currentGame.value)
})
</script>

<template>
  <div
    class="now-playing-container border-4 border-synth-pink rounded-xl relative p-6 bg-slate-950 overflow-hidden shadow-neon-pink"
  >
    <div class="background-flicker"></div>

    <div class="relative z-10 text-center">
      <span v-if="!currentGame.title">
        <p class="text-synth-purple tracking-widest font-mono text-sm uppercase">
          Obteniendo información del juego actual...
        </p>
      </span>
      <span v-else>
        <p class="text-synth-purple tracking-widest font-mono text-sm uppercase">Now Playing</p>
        <h3 class="game-title text-white text-3xl font-black mt-2 tracking-tight">
          {{ currentGame.title }}
        </h3>
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Capa de brillo de fondo sutil */
.background-flicker {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, var(--color-synth-pink) 0%, transparent 80%);
  opacity: 0.1; /* Brillo muy sutil para evitar el "color entero" */
  animation: bgFlicker 4s infinite;
  z-index: 1;
}

/* Brillo de neón en el título del juego */
.game-title {
  text-shadow:
    0 0 5px rgba(255, 255, 255, 1),
    0 0 10px rgba(0, 240, 255, 1),
    /* Brillo cian */ 0 0 20px rgba(0, 240, 255, 1),
    0 0 40px rgba(157, 78, 221, 1); /* Brillo violeta externo */
}

/* Animación de parpadeo suave para el fondo */
@keyframes bgFlicker {
  0%,
  19%,
  21%,
  23%,
  25%,
  54%,
  56%,
  100% {
    opacity: 0.1;
  }
  20%,
  24%,
  55% {
    opacity: 0.05;
  }
}
</style>
