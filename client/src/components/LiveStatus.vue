<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const isLive = ref(false)
const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/twitch/status'
    : '/api/twitch/status'

const checkStatus = async () => {
  try {
    const res = await axios.get(API_URL)
    isLive.value = res.data.isLive
  } catch (err) {
    isLive.value = false
  }
}

onMounted(() => {
  checkStatus()
  setInterval(checkStatus, 120000)
})
</script>

<template>
  <div class="flex flex-col items-start space-y-1 font-mono">
    <div class="flex items-center space-x-2 text-sm md:text-xl font-bold tracking-wider uppercase">
      <template v-if="isLive">
        <span class="relative flex h-3 w-3">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
          ></span>
          <span
            class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_#10b981]"
          ></span>
        </span>
        <span class="text-emerald-400 drop-shadow-[0_0_6px_#10b981]">LIVE</span>
      </template>

      <template v-else>
        <span class="h-3 w-3 rounded-full bg-rose-950 border border-rose-800"></span>
        <span class="text-rose-700/60 drop-shadow-[0_0_4px_rgba(244,63,94,0.1)]">OFFLINE</span>
      </template>
    </div>

    <a
      v-if="isLive"
      href="https://twitch.tv/tehpon"
      target="_blank"
      rel="noopener noreferrer"
      class="text-xs md:text-sm font-bold tracking-wide text-synth-purple hover:text-synth-pink transition-all duration-300 drop-shadow-[0_0_2px_rgba(145,70,255,0.3)] hover:drop-shadow-[0_0_8px_#ff007f] flex items-center space-x-1"
    >
      <span>IR AL STREAM</span>
      <i class="fas fa-external-link-alt text-[10px]"></i>
    </a>
  </div>
</template>
