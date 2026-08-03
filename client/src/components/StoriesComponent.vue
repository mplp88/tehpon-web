<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

// Estado del visor
const isViewerOpen = ref(false)
const currentIndex = ref(0)
const progress = ref(0)
const isPaused = ref(false)
const isMuted = ref(true) // Comienza muteado por políticas de autoplay

// Referencia al elemento video del DOM
const videoRef = ref(null)

// Variables para el temporizador y gestos
let storyTimer = null
let holdTimer = null
const HOLD_THRESHOLD = 200 // ms para considerar que es "Hold" y no un "Tap"
let isHolding = false

// Escuchar cambios de la historia activa para reiniciar video / audio
const currentStory = computed(() => activeStories.value[currentIndex.value] || null)

// Cambiar o pausar la reproducción según el estado
const toggleAudio = (e) => {
  e.stopPropagation() // Evitar que el click active el paso de historia
  isMuted.value = !isMuted.value
  if (videoRef.value) {
    videoRef.value.muted = isMuted.value
  }
}

// Lógica de avance/retroceso del temporizador
const startStoryProgress = () => {
  clearInterval(storyTimer)
  progress.value = 0

  if (!currentStory.value) return

  const durationMs = currentStory.value.duration * 1000
  const interval = 50 // actualización cada 50ms
  const step = (interval / durationMs) * 100

  // Si es video, asegurarse de que reproduzca
  if (currentStory.value.mediaType === 'video' && videoRef.value) {
    videoRef.value.currentTime = 0
    videoRef.value.play().catch(() => {
      // Si falla el autoplay por alguna razón, forzar mute
      isMuted.value = true
      videoRef.value.play()
    })
  }

  storyTimer = setInterval(() => {
    if (!isPaused.value) {
      progress.value += step
      if (progress.value >= 100) {
        nextStory()
      }
    }
  }, interval)
}

const nextStory = () => {
  if (currentIndex.value < activeStories.value.length - 1) {
    currentIndex.value++
    startStoryProgress()
  } else {
    closeStory()
  }
}

const prevStory = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    startStoryProgress()
  } else {
    // Si es la primera, reiniciamos el progreso
    startStoryProgress()
  }
}

const openStory = (index = 0) => {
  currentIndex.value = index
  isViewerOpen.value = true
  isPaused.value = false
  startStoryProgress()
}

const closeStory = () => {
  clearInterval(storyTimer)
  clearTimeout(holdTimer)
  isViewerOpen.value = false
  isPaused.value = false
  progress.value = 0
  if (videoRef.value) {
    videoRef.value.pause()
  }
}

// --- GESTIÓN DE TAPS Y TAP & HOLD ---

const handlePressStart = () => {
  isHolding = false
  holdTimer = setTimeout(() => {
    isHolding = true
    isPaused.value = true
    if (videoRef.value) {
      videoRef.value.pause()
    }
  }, HOLD_THRESHOLD)
}

const handlePressEnd = (e) => {
  clearTimeout(holdTimer)

  if (isHolding) {
    // Era un HOLD: al soltar, reanudamos
    isPaused.value = false
    if (videoRef.value) {
      videoRef.value.play()
    }
    isHolding = false
  } else {
    // Era un TAP corto: detectamos si fue a la izquierda (anterior) o derecha/centro (siguiente)
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX)
    const touchOffset = clientX - rect.left

    if (touchOffset < rect.width * 0.3) {
      prevStory()
    } else {
      nextStory()
    }
  }
}

onUnmounted(() => {
  clearInterval(storyTimer)
  clearTimeout(holdTimer)
})
</script>

<template>
  <!-- Modal Visor de Historias -->
  <Transition name="fade">
    <div
      v-if="isViewerOpen && currentStory"
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center select-none backdrop-blur-sm"
      @click.self="closeStory"
    >
      <!-- @click.self en el fondo oscuro: Cierra la historia al hacer clic AFUERA del contenedor -->

      <div
        class="relative w-full max-w-md h-full max-h-[90vh] bg-black rounded-lg overflow-hidden flex flex-col justify-between shadow-2xl"
        @mousedown="handlePressStart"
        @mouseup="handlePressEnd"
        @touchstart.passive="handlePressStart"
        @touchend="handlePressEnd"
      >
        <!-- Barras de Progreso e Info Superior -->
        <div
          class="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-black/80 to-transparent"
        >
          <!-- Líneas de progreso -->
          <div class="flex gap-1 mb-2">
            <div
              v-for="(story, idx) in activeStories"
              :key="story._id"
              class="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-white transition-all duration-75 ease-linear"
                :style="{
                  width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%',
                }"
              ></div>
            </div>
          </div>

          <!-- Header (Streamer avatar, nombre y controles) -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img
                src="@/assets/logo.png"
                class="w-8 h-8 rounded-full border border-synth-pink"
                alt="Streamer"
              />
              <span class="text-white text-sm font-semibold">Tu Canal</span>
            </div>

            <div class="flex items-center gap-3">
              <!-- Botón Toggle Mute/Unmute (solo si es video) -->
              <button
                v-if="currentStory.mediaType === 'video'"
                @click="toggleAudio"
                class="text-white bg-black/40 p-1.5 rounded-full hover:bg-black/70 transition"
              >
                <!-- Icono Unmute / Mute -->
                <svg
                  v-if="!isMuted"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.314M11 5L6 9H2v6h4l5 4V5z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    stroke-dasharray="2 2"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              </button>

              <!-- Botón Cerrar Cross -->
              <button @click="closeStory" class="text-white/80 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Contenido Multimedia (Imagen o Video) -->
        <div class="w-full h-full flex items-center justify-center bg-black">
          <img
            v-if="currentStory.mediaType === 'image'"
            :src="`http://localhost:5051${currentStory.mediaUrl}`"
            class="max-h-full w-full object-contain"
            alt="Historia"
          />

          <video
            v-else-if="currentStory.mediaType === 'video'"
            ref="videoRef"
            :src="`http://localhost:5051${currentStory.mediaUrl}`"
            class="max-h-full w-full object-contain"
            playsinline
            :muted="isMuted"
          ></video>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
