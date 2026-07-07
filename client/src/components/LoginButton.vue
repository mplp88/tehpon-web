<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { token, login, logout } = useAuth()
</script>

<template>
  <div class="flex items-center">
    <button
      v-if="!token"
      @click="login"
      class="flex items-center space-x-2 px-2 py-2 bg-[#9146ff] border border-transparent rounded-lg text-white font-bold text-sm tracking-wide transition-all duration-300 hover:bg-transparent hover:border-[#9146ff] hover:text-[#9146ff] hover:shadow-[0_0_15px_rgba(145,70,255,0.6)]"
    >
      <i class="fab fa-twitch text-base"></i>
      <span>CONECTAR TWITCH</span>
    </button>
    <button
      v-else
      @click="logout"
      class="flex items-center space-x-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 font-bold text-sm tracking-wide transition-all duration-300 hover:text-synth-pink hover:border-synth-pink"
    >
      <span>CERRAR SESIÓN</span>
    </button>
  </div>
</template>
