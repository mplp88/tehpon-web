<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import axios from 'axios'

interface Command {
  _id: string
  name: string
  description: string
  category: 'social' | 'overlay' | 'rpg' | 'utilidad'
  isActive: boolean
  chatResponse?: string
  cooldown?: number
  media?: {
    soundFile?: string
    imageFile?: string
  }
}

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''

const { isAdmin, token } = useAuth()

const showForm = ref(false)
const commands = ref<Command[]>([])
const loading = ref(true)
const selectedCategory = ref<string>('todos')

// Formulario
const isEditing = ref(false)
const currentId = ref<string | null>(null)
const formData = ref({
  name: '',
  description: '',
  category: 'social',
  isActive: true,
  chatResponse: '',
  cooldown: 30,
  soundFile: '',
  imageFile: '',
})

const categories = ['todos', 'social', 'overlay', 'rpg', 'utilidad']

const fetchCommands = async () => {
  try {
    const url = `${API_URL}/${isAdmin.value ? 'api/commands?all=true' : 'api/commands'}`
    const res = await axios.get(url)
    if (res.data) {
      commands.value = await res.data
    }
  } catch (err) {
    console.error('Error fetching commands:', err)
  } finally {
    loading.value = false
  }
}

const filteredCommands = computed(() => {
  if (selectedCategory.value === 'todos') return commands.value
  return commands.value.filter((c) => c.category === selectedCategory.value)
})

const openCreateForm = () => {
  resetForm()
  showForm.value = true
}

const resetForm = () => {
  isEditing.value = false
  currentId.value = null
  formData.value = {
    name: '',
    description: '',
    category: 'social',
    isActive: true,
    chatResponse: '',
    cooldown: 30,
    soundFile: '',
    imageFile: '',
  }
}

const editCommand = (cmd: Command) => {
  isEditing.value = true
  currentId.value = cmd._id
  formData.value = {
    name: cmd.name,
    description: cmd.description,
    category: cmd.category,
    isActive: cmd.isActive,
    chatResponse: cmd.chatResponse || '',
    cooldown: cmd.cooldown || 0,
    soundFile: cmd.media?.soundFile || '',
    imageFile: cmd.media?.imageFile || '',
  }
  showForm.value = true
}

const closeForm = () => {
  resetForm()
  showForm.value = false
}

const handleSubmit = async () => {
  const payload = {
    name: formData.value.name,
    description: formData.value.description,
    category: formData.value.category,
    isActive: formData.value.isActive,
    chatResponse: formData.value.chatResponse || undefined,
    cooldown: Number(formData.value.cooldown),
    media: {
      soundFile: formData.value.soundFile || undefined,
      imageFile: formData.value.imageFile || undefined,
    },
  }

  const endpoint = isEditing.value ? `api/commands/${currentId.value}` : 'api/commands'
  const method = isEditing.value ? 'put' : 'post'

  try {
    const res = await axios[method](`${API_URL}/${endpoint}`, payload, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (res.data) {
      resetForm()
      await fetchCommands()
      closeForm()
    } else {
      const errData = await res.data
      alert(errData.error || 'Error al guardar el comando')
    }
  } catch (err) {
    console.error('Error guardando comando:', err)
  }
}

const deleteCommand = async (id: string) => {
  if (!confirm('¿Seguro de eliminar este comando?')) return

  try {
    const res = await axios.delete(`${API_URL}/api/commands/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (res.data) {
      await fetchCommands()
    }
  } catch (err) {
    console.error('Error eliminando comando:', err)
  }
}

onMounted(async () => {
  debugger
  await fetchCommands()
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header de navegación -->
    <div class="flex items-center justify-between mb-8">
      <router-link
        to="/"
        class="text-sm text-synth-cyan hover:text-white transition-colors flex items-center gap-2 font-mono"
      >
        <i class="fas fa-arrow-left"></i> VOLVER AL HOME
      </router-link>
      <h1 class="text-md font-bold font-mono text-synth-pink tracking-wider">!COMANDOS DEL BOT</h1>
    </div>

    <!-- FORMULARIO DE ADMIN (Aparece condicionalmente) -->
    <div
      v-if="isAdmin && showForm"
      class="mb-12 bg-slate-900/95 border border-synth-pink p-6 rounded-xl shadow-neon-pink transition-all duration-300"
    >
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-synth-cyan font-mono uppercase">
          {{ isEditing ? '✏️ Editar Comando' : '➕ Agregar Nuevo Comando' }}
        </h2>
        <button
          @click="closeForm"
          type="button"
          class="text-slate-400 hover:text-synth-pink text-xl font-bold transition-colors"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Campos del formulario -->
        <div>
          <label class="block text-xs font-mono text-slate-300 mb-1">Nombre (!comando)</label>
          <input
            v-model="formData.name"
            required
            placeholder="!rickroll"
            class="w-full bg-slate-950 border border-synth-purple/40 rounded p-2 text-white font-mono focus:border-synth-cyan outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-mono text-slate-300 mb-1">Categoría</label>
          <select
            v-model="formData.category"
            class="w-full bg-slate-950 border border-synth-purple/40 rounded p-2 text-white font-mono focus:border-synth-cyan outline-none"
          >
            <option value="social">Social</option>
            <option value="overlay">Overlay</option>
            <option value="rpg">RPG</option>
            <option value="utilidad">Utilidad</option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="block text-xs font-mono text-slate-300 mb-1">Descripción</label>
          <input
            v-model="formData.description"
            required
            placeholder="Descripción corta para la web"
            class="w-full bg-slate-950 border border-synth-purple/40 rounded p-2 text-white font-mono focus:border-synth-cyan outline-none"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block text-xs font-mono text-slate-300 mb-1"
            >Respuesta de Chat (usa {user})</label
          >
          <input
            v-model="formData.chatResponse"
            placeholder="Ej: ¡@{user} acaba de disparar el rickroll!"
            class="w-full bg-slate-950 border border-synth-purple/40 rounded p-2 text-white font-mono focus:border-synth-cyan outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-mono text-slate-300 mb-1"
            >Archivo de Sonido (opcional)</label
          >
          <input
            v-model="formData.soundFile"
            placeholder="rickroll.mp3"
            class="w-full bg-slate-950 border border-synth-purple/40 rounded p-2 text-white font-mono focus:border-synth-cyan outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-mono text-slate-300 mb-1"
            >Archivo de Imagen (opcional)</label
          >
          <input
            v-model="formData.imageFile"
            placeholder="rickroll.gif"
            class="w-full bg-slate-950 border border-synth-purple/40 rounded p-2 text-white font-mono focus:border-synth-cyan outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-mono text-slate-300 mb-1">Cooldown (segundos)</label>
          <input
            v-model="formData.cooldown"
            type="number"
            min="0"
            class="w-full bg-slate-950 border border-synth-purple/40 rounded p-2 text-white font-mono focus:border-synth-cyan outline-none"
          />
        </div>

        <div class="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="isActive"
            v-model="formData.isActive"
            class="accent-synth-pink w-4 h-4"
          />
          <label for="isActive" class="text-sm font-mono text-slate-300">Comando Activo</label>
        </div>

        <div class="md:col-span-2 flex gap-4 mt-2">
          <button
            type="submit"
            class="px-6 py-2 bg-synth-pink font-bold text-slate-950 rounded hover:shadow-neon-pink transition-all"
          >
            {{ isEditing ? 'Guardar Cambios' : 'Crear Comando' }}
          </button>

          <button
            type="button"
            @click="closeForm"
            class="px-6 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <!-- FILTRO POR CATEGORÍA -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
      <button
        v-for="cat in categories"
        :key="cat"
        @click="selectedCategory = cat"
        :class="[
          'px-4 py-2 rounded-lg font-mono text-sm capitalize transition-all border',
          selectedCategory === cat
            ? 'bg-synth-cyan border-synth-cyan text-slate-950 font-bold shadow-neon-cyan'
            : 'bg-slate-900 border-synth-purple/30 text-slate-300 hover:border-synth-cyan',
        ]"
      >
        {{ cat }}
      </button>
    </div>

    <!-- LISTADO DE COMANDOS -->
    <div v-if="loading" class="text-center font-mono text-synth-cyan py-12">
      Cargando comandos...
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="cmd in filteredCommands"
        :key="cmd._id"
        :class="[
          'p-5 rounded-xl border bg-slate-900/80 backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1',
          cmd.isActive ? 'border-synth-purple shadow-neon-purple' : 'border-slate-800 opacity-60',
        ]"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="font-mono font-bold text-xl text-synth-cyan">{{ cmd.name }}</span>
            <span
              class="text-xs uppercase font-mono px-2 py-0.5 rounded bg-synth-purple/20 text-synth-purple border border-synth-purple/40"
            >
              {{ cmd.category }}
            </span>
          </div>

          <p class="text-sm text-slate-200 mb-4">{{ cmd.description }}</p>

          <div
            v-if="cmd.chatResponse"
            class="text-xs font-mono bg-slate-950 p-2 rounded border border-slate-800 text-slate-400 mb-3"
          >
            💬 {{ cmd.chatResponse }}
          </div>

          <div class="flex gap-4 text-xs font-mono text-slate-400">
            <span v-if="cmd.cooldown">⏳ {{ cmd.cooldown }}s</span>
            <span v-if="cmd.media?.soundFile">🎵 Audio</span>
            <span v-if="cmd.media?.imageFile">🖼️ Overlay</span>
          </div>
        </div>

        <!-- Acciones Admin -->
        <div v-if="isAdmin" class="mt-4 pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            @click="editCommand(cmd)"
            class="px-3 py-1 bg-synth-cyan/20 border border-synth-cyan text-synth-cyan text-xs font-mono rounded hover:bg-synth-cyan hover:text-slate-950"
          >
            Editar
          </button>
          <button
            @click="deleteCommand(cmd._id)"
            class="px-3 py-1 bg-red-500/20 border border-red-500 text-red-400 text-xs font-mono rounded hover:bg-red-500 hover:text-white"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>

    <!-- BOTÓN FLOTANTE DE AGREGAR (Solo Admin) -->
    <button
      v-if="isAdmin"
      @click="showForm ? closeForm() : openCreateForm()"
      class="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-synth-pink text-slate-950 border-2 border-slate-950 flex items-center justify-center text-2xl shadow-neon-pink transition-all duration-300 hover:scale-110 active:scale-95"
      :title="showForm ? 'Cerrar formulario' : 'Agregar comando'"
    >
      <i :class="['fas', showForm ? 'fa-times' : 'fa-plus']"></i>
    </button>
  </div>
</template>
