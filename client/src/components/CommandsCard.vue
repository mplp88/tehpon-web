<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

interface Command {
  _id: string
  name: string
  description: string
  category: string
}

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''

const commands = ref<Command[]>([])
const loading = ref(true)

const fetchPreviewCommands = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/commands`)
    if (res.data) {
      const { data } = res
      commands.value = data //.slice(0, 4) // Mostramos solo los primeros 4
    }
  } catch (err) {
    console.error('Error cargando preview de comandos:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchPreviewCommands()
})
</script>

<template>
  <div
    class="bg-slate-900/80 backdrop-blur-md border border-synth-purple p-6 rounded-xl shadow-neon-purple text-center flex flex-col justify-between"
  >
    <h2
      class="text-2xl font-bold text-synth-cyan shadow-neon-cyan mb-6 tracking-widest uppercase py-3"
    >
      Comandos
    </h2>
    <div class="space-y-4 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
      <div v-if="loading" class="text-slate-400 font-mono py-4">Cargando...</div>

      <div v-else class="space-y-3 mb-6 text-left">
        <div
          v-for="cmd in commands"
          :key="cmd._id"
          class="p-3 bg-slate-950/60 border border-synth-cyan/30 rounded-lg flex items-center justify-between"
        >
          <span class="font-mono font-bold text-synth-pink">{{ cmd.name }}</span>
          <span class="text-xs text-slate-300 truncate max-w-35" :title="cmd.description">{{
            cmd.description
          }}</span>
        </div>
      </div>
    </div>

    <router-link
      to="/commands"
      class="block w-full py-3 px-4 bg-synth-cyan border border-transparent rounded-lg text-slate-950 font-bold tracking-wider transition-all duration-300 hover:bg-transparent hover:border-synth-cyan hover:text-synth-cyan hover:shadow-neon-cyan mt-4"
    >
      <i class="fas fa-terminal mr-2"></i> VER TODOS
    </router-link>
  </div>
</template>
