<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

import { useAuth } from '@/composables/useAuth'
import { useAlerts } from '@/composables/useAlerts'
import Swal from 'sweetalert2'

interface IUpdate {
  _id: string
  description: string
  title: string
  createdAt: string
}

const { token, isAdmin } = useAuth()
const { showError } = useAlerts()
const updates = ref<IUpdate[]>([])
const loading = ref(true)

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''

const fetchUpdates = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/api/updates`)
    updates.value = data
  } catch (error) {
    showError((error as any).message)
    console.log(error)
  } finally {
    loading.value = false
  }
}

const openCreateModal = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'NUEVA NOVEDAD',
    html:
      '<input id="swal-title" class="swal2-input bg-slate-900 border-synth-cyan text-white rounded p-2 w-full mb-3" placeholder="Título">' +
      '<textarea id="swal-desc" class="swal2-textarea bg-slate-900 border-synth-cyan text-white rounded p-2 w-full h-24" placeholder="Descripción"></textarea>',
    focusConfirm: false,
    background: '#0b0813',
    confirmButtonText: 'PUBLICAR',
    customClass: {
      popup: 'border-2 border-synth-cyan font-mono',
      confirmButton: 'bg-synth-cyan text-slate-950 font-black px-4 py-2 rounded',
    },
    buttonsStyling: false,
    preConfirm: () => {
      const titleInput = Swal.getPopup()?.querySelector('#swal-title') as HTMLInputElement | null
      const descInput = Swal.getPopup()?.querySelector('#swal-desc') as HTMLTextAreaElement | null

      if (!titleInput?.value || !descInput?.value) {
        Swal.showValidationMessage('Por favor completa ambos campos')
        return false
      }

      return {
        title: titleInput.value,
        description: descInput.value,
      }
    },
  })

  if (formValues?.title && formValues?.description) {
    try {
      await axios.post(`${import.meta.env.API_URL}/api/updates`, formValues, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      fetchUpdates()
    } catch (err) {
      Swal.fire('Error', (err as any).response?.data?.message, 'error')
    }
  }
}

// Editar novedad existente
const openEditModal = async (item: IUpdate) => {
  const { value: formValues } = await Swal.fire({
    title: 'EDITAR NOVEDAD',
    html:
      `<input id="swal-title" class="swal2-input bg-slate-900 text-white rounded p-2 w-full mb-3" value="${item.title}">` +
      `<textarea id="swal-desc" class="swal2-textarea bg-slate-900 text-white rounded p-2 w-full h-24">${item.description}</textarea>`,
    background: '#0b0813',
    confirmButtonText: 'GUARDAR',
    customClass: {
      popup: 'border-2 border-synth-purple font-mono',
      confirmButton: 'bg-synth-purple text-white px-4 py-2 rounded',
    },
    buttonsStyling: false,
    preConfirm: () => {
      const titleInput = Swal.getPopup()?.querySelector('#swal-title') as HTMLInputElement | null
      const descInput = Swal.getPopup()?.querySelector('#swal-desc') as HTMLTextAreaElement | null

      if (!titleInput?.value || !descInput?.value) {
        Swal.showValidationMessage('Por favor completa ambos campos')
        return false
      }

      return {
        title: titleInput.value,
        description: descInput.value,
      }
    },
  })

  if (formValues) {
    try {
      await axios.put(`${API_URL}/api/updates/${item._id}`, formValues, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      fetchUpdates()
    } catch (err) {
      console.error(err)
    }
  }
}

// Borrar novedad con confirmación
const deleteUpdate = async (id: string) => {
  const result = await Swal.fire({
    title: '¿BORRAR?',
    text: 'Esta acción destruirá el registro de la bitácora.',
    icon: 'warning',
    showCancelButton: true,
    background: '#0b0813',
    confirmButtonText: 'SÍ, BORRAR',
    customClass: {
      popup: 'border-2 border-synth-pink font-mono',
      confirmButton: 'bg-synth-pink text-slate-950 px-4 py-2 rounded m-2',
      cancelButton: 'text-slate-400 m-2',
    },
    buttonsStyling: false,
  })

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_URL}/api/updates/${id}`, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      fetchUpdates()
    } catch (err) {
      console.error(err)
    }
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  fetchUpdates()
})
</script>

<template>
  <div
    class="bg-slate-900/80 backdrop-blur-md border border-synth-purple p-6 rounded-xl shadow-neon-purple"
  >
    <h2
      class="text-2xl font-bold text-synth-cyan shadow-neon-cyan mb-6 tracking-widest uppercase text-center animate-flicker py-3"
    >
      Últimas Novedades
    </h2>
    <button
      v-if="isAdmin"
      @click="openCreateModal"
      class="absolute top-4 right-4 text-xs px-2 py-1 bg-synth-pink text-slate-950 font-black rounded hover:shadow-neon-pink transition-all"
    >
      + NUEVO
    </button>
    <div v-if="loading" class="text-center py-8 text-synth-purple animate-pulse font-mono">
      ⏳ Leyendo bitácora...
    </div>
    <div v-else class="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
      <div
        v-for="item in updates"
        :key="item._id"
        class="p-4 bg-slate-950/60 border border-slate-900 rounded-lg group relative"
      >
        <div
          v-if="isAdmin"
          class="absolute top-2 right-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button @click="openEditModal(item)" class="text-synth-cyan text-sm hover:cursor-pointer">
            <i class="fas fa-pen"></i>
          </button>
          <button
            @click="deleteUpdate(item._id)"
            class="text-synth-pink text-sm hover:cursor-pointer"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>

        <h3 class="font-bold text-synth-pink text-base mb-1 tracking-wide uppercase">
          {{ item.title }}
        </h3>
        <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
          {{ item.description }}
        </p>
        <span class="block text-[10px] text-slate-500 font-mono mt-2">{{
          formatDate(item.createdAt)
        }}</span>
      </div>

      <p v-if="updates.length === 0" class="text-center text-slate-500 text-sm font-mono py-4">
        Sin novedades por el momento.
      </p>
    </div>
  </div>
</template>
