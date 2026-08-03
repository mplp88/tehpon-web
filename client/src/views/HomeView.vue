<script setup lang="ts">
import LinksCard from '@/components/LinksCard.vue'
import CommandsCard from '@/components/CommandsCard.vue'
import GamesCard from '@/components/GamesCard.vue'
import UpdatesCard from '@/components/UpdatesCard.vue'
import NowPlaying from '@/components/NowPlaying.vue'

import { ref, onMounted, computed, onUnmounted, nextTick } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAlerts } from '@/composables/useAlerts'
import axios from 'axios'

interface IStory {
  _id: string
  mediaUrl: string
  mediaType: string
  duration: number
  createdAt: Date
  expiresAt: Date
}

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''

const { token, isAdmin } = useAuth()
const { showError } = useAlerts()

const activeStories = ref<IStory[]>([])
const hasActiveStory = computed(() => activeStories.value.length > 0)

const showUploadModal = ref(false)
const selectedDuration = ref(5)
const isUploading = ref(false)
const fileInput = ref(null)

const currentStoryIndex = ref(0)
const currentStory = computed<IStory | null>(
  () => activeStories.value[currentStoryIndex.value] || null,
)
const isViewingStory = ref(false)
const storyProgress = ref(0)
const videoRef = ref<HTMLVideoElement | null>(null)

let storyTimer: number | undefined = undefined
let holdTimer: number | undefined = undefined
let isHolding = false
const HOLD_THRESHOLD = 200
const isMuted = ref(true)
const isPaused = ref(false)

const fetchActiveStories = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/api/stories/active`)
    activeStories.value = data
  } catch (err) {
    console.error('Error al cargar historias:', (err as Error).message)
  }
}

const triggerFileSelect = () => {
  ;(fileInput.value as any).click()
}

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(Math.round(video.duration)) // Duración en segundos (redondeada)
    }

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src)
      reject('No se pudo leer la duración del video.')
    }

    video.src = URL.createObjectURL(file)
  })
}

const handleFileChange = async (e: any) => {
  const file = e.target.files[0]
  if (!file) return

  let storyDuration = Number(selectedDuration.value)

  // Si es video, calculamos su duración real
  if (file.type.startsWith('video/')) {
    try {
      storyDuration = await getVideoDuration(file)
      console.log(`Video detectado. Duración real: ${storyDuration}s`)
    } catch (err) {
      console.warn('Error al calcular la duración del video, usando valor por defecto:', err)
    }
  }

  await uploadStory(file, storyDuration)
  e.target.value = ''
}

const uploadStory = async (fileToUpload: File, duration: number = 5) => {
  isUploading.value = true

  // 1. Crear el objeto FormData
  const formData = new FormData()

  // 2. Agregar el archivo (el nombre 'mediaFile' debe coincidir con upload.single('mediaFile') en el backend)
  formData.append('mediaFile', fileToUpload)

  // 3. Agregar los otros campos (duration)
  formData.append('duration', '' + duration)

  try {
    // Usando Fetch (Importante: NO setear 'Content-Type' header, el navegador lo hace solo con el boundary correcto)
    const res = await axios.post(`${API_URL}/api/stories`, formData, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (res.status < 400) {
      showUploadModal.value = false
      await fetchActiveStories() // Recargar para ver el glow
    } else {
      const { data } = res
      showError(`Error: ${data.message}`)
    }
  } catch (err) {
    console.error('Error al subir historia con FormData:', (err as Error).message)
    showError('Falló la conexión con el servidor al subir el archivo.')
  } finally {
    isUploading.value = false
  }
}

const openStory = () => {
  if (!hasActiveStory.value) return
  currentStoryIndex.value = 0
  isViewingStory.value = true
  isPaused.value = false
  startStoryTimer()
}

const closeStory = () => {
  isViewingStory.value = false
  clearInterval(storyTimer)
  storyProgress.value = 0
  isPaused.value = false
  if (videoRef.value) {
    videoRef.value.pause()
  }
}

const startStoryTimer = () => {
  clearInterval(storyTimer)
  storyProgress.value = 0

  //const current = currentStory.value
  if (!currentStory.value) {
    return
  }

  const durationMs = currentStory.value.duration * 1000
  const intervalMs = 50
  const step = (intervalMs / durationMs) * 100

  console.log(currentStory)
  if (currentStory.value.mediaType === 'video') {
    console.log(`MediaType: ${currentStory.value.mediaType}`)
    nextTick(() => {
      if (videoRef.value) {
        console.log(`Muted: ${videoRef.value.muted}`)
        videoRef.value.muted = isMuted.value
        videoRef.value.currentTime = 0
        videoRef.value.play().catch((err) => {
          console.warn('El navegador bloqueó la reproducción con audio:', err.message)
          // Si falla el autoplay por alguna razón, forzar mute
          isMuted.value = true
          videoRef.value?.play()
        })
      }
    })
  }

  storyTimer = setInterval(() => {
    if (!isPaused.value) {
      storyProgress.value += step
      if (storyProgress.value >= 100) {
        nextStory()
      }
    }
  }, intervalMs)
}

const nextStory = () => {
  if (currentStoryIndex.value < activeStories.value.length - 1) {
    currentStoryIndex.value++
    startStoryTimer()
  } else {
    closeStory()
  }
}

const prevStory = () => {
  if (currentStoryIndex.value > 0) {
    currentStoryIndex.value--
    startStoryTimer()
  } else {
    // Si es la primera, reiniciamos el progreso
    startStoryTimer()
  }
}

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

const handlePressEnd = (e: MouseEvent | TouchEvent) => {
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
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    let clientX: number | undefined = 0

    if (e instanceof MouseEvent) {
      // e as MouseEvent
      clientX = e.clientX
    } else {
      // e as TouchEvent
      clientX = e.changedTouches && e.changedTouches[0]?.clientX
    }

    const touchOffset: number = (clientX ?? 0) - rect.left

    if (touchOffset < rect.width * 0.3) {
      prevStory()
    } else {
      nextStory()
    }
  }
}

const handleLogoClick = () => {
  if (hasActiveStory.value) {
    openStory()
  } else if (isAdmin.value) {
    showUploadModal.value = true
  }
}

const toggleAudio = (e: Event) => {
  e.stopPropagation() // Evitar que el click active el paso de historia
  isMuted.value = !isMuted.value
  if (videoRef.value) {
    videoRef.value.muted = isMuted.value
  }
}

onMounted(() => {
  fetchActiveStories()
})

onUnmounted(() => {
  clearInterval(storyTimer)
  clearTimeout(holdTimer)
})
</script>

<template>
  <div>
    <!-- Header exacto de la Home original -->
    <header class="flex flex-col items-center justify-center pt-8 pb-10">
      <div
        @click="handleLogoClick()"
        class="p-1 rounded-full transition-all duration-500"
        :class="[
          hasActiveStory
            ? 'p-0.75 bg-linear-to-tr from-synth-pink via-purple-500 to-synth-cyan animate-pulse drop-shadow-[0_0_20px_rgba(255,0,127,0.8)]'
            : '',
        ]"
      >
        <img
          src="../assets/logo.png"
          alt="TehPon Logo"
          class="w-32 h-32 rounded-full object-contain filter drop-shadow-[0_0_25px_rgba(255,0,127,0.5)] transition-transform duration-500"
        />
        <button
          v-if="isAdmin"
          @click.stop="showUploadModal = true"
          title="Subir Historia"
          class="absolute bottom-1 right-1 bg-synth-pink text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xl border-2 border-slate-900 shadow-lg active:scale-95 transition-transform duration-200 z-10"
        >
          <i class="fas fa-plus fa-xs"></i>
        </button>
      </div>

      <input
        type="file"
        ref="fileInput"
        accept="image/*,video/*"
        class="hidden"
        @change="handleFileChange"
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

    <!-- Main Grid exacto de 3 columnas para Desktop -->
    <main class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <LinksCard />
      <GamesCard />
      <CommandsCard />
      <UpdatesCard class="lg:col-span-3" />
    </main>

    <Teleport to="body">
      <div
        v-if="showUploadModal"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div
          class="bg-slate-900 border border-synth-pink p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-neon-pink"
        >
          <h3 class="text-xl font-bold text-white font-mono">Nueva Historia</h3>

          <div class="text-left space-y-2">
            <label class="text-sm font-mono text-gray-300">Duración en pantalla:</label>
            <select
              v-model="selectedDuration"
              class="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2 font-mono focus:border-synth-pink focus:outline-none"
            >
              <option :value="5">5 segundos</option>
              <option :value="10">10 segundos</option>
              <option :value="15">15 segundos</option>
              <option :value="20">20 segundos</option>
              <option :value="30">30 segundos</option>
            </select>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              @click="showUploadModal = false"
              class="flex-1 py-2 rounded-lg bg-slate-800 text-gray-300 hover:bg-slate-700 font-mono"
            >
              Cancelar
            </button>
            <button
              @click="triggerFileSelect"
              :disabled="isUploading"
              class="flex-1 py-2 rounded-lg bg-synth-pink text-white font-bold font-mono hover:brightness-110 active:scale-95 transition-all"
            >
              {{ isUploading ? 'Subiendo...' : 'Elegir Archivo' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- VISOR FULLSCREEN DE STORIES -->
    <Teleport to="body">
      <div
        v-if="isViewingStory && currentStory"
        class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4"
        @click.self="closeStory"
      >
        <!-- Barra superior de Progreso -->
        <div class="w-full max-w-md flex gap-1 z-10 pt-2">
          <div
            v-for="(story, idx) in activeStories"
            :key="story._id"
            class="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden"
          >
            <div
              class="h-full bg-synth-pink transition-all duration-75"
              :style="{
                width:
                  idx < currentStoryIndex
                    ? '100%'
                    : idx === currentStoryIndex
                      ? `${storyProgress}%`
                      : '0%',
              }"
            ></div>
          </div>
        </div>

        <!-- Botón Toggle Mute/Unmute (solo si es video) -->
        <button
          v-if="activeStories[currentStoryIndex]?.mediaType === 'video'"
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
        <!-- Botón de Cerrar (X) -->
        <button
          @click="closeStory"
          class="absolute top-6 right-6 text-white text-3xl font-bold z-20 hover:text-synth-pink"
        >
          <i class="fas fa-close"></i>
        </button>

        <!-- Contenido Multimedia -->
        <div
          class="relative flex-1 w-full max-w-md flex items-center justify-center overflow-hidden my-auto"
          @mousedown="handlePressStart"
          @mouseup="handlePressEnd"
          @touchstart.passive="handlePressStart"
          @touchend="handlePressEnd"
        >
          <img
            v-if="currentStory?.mediaType === 'image'"
            :src="`${API_URL}${currentStory?.mediaUrl}`"
            class="max-h-full max-w-full object-contain rounded-lg"
          />
          <video
            v-else
            :src="`${API_URL}${currentStory?.mediaUrl}`"
            ref="videoRef"
            autoplay
            :muted="isMuted"
            playsinline
            class="max-h-full max-w-full object-contain rounded-lg"
          ></video>
        </div>
      </div>
    </Teleport>
  </div>
</template>
