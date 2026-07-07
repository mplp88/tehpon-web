import { ref } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const token = ref(localStorage.getItem('twitch_token') || null)
const user = ref(JSON.parse(localStorage.getItem('twitch_user')!) || null)
const isAdmin = ref(localStorage.getItem('is_streamer_admin') === 'true')
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''

export function useAuth() {
  const TWITCH_CLIENT_ID = '37bkoyr1uulopujj9bc5dm2ew84hyq'
  const REDIRECT_URI =
    window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.1')
      ? 'http://localhost:5173'
      : 'https://tehpon.martinponce.com.ar'

  const login = () => {
    const scope = 'user:read:email'
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${scope}`
    window.location.href = authUrl
  }

  const logout = () => {
    token.value = null
    user.value = null
    isAdmin.value = false
    localStorage.clear()
    window.location.hash = ''
  }

  const verifyIdentity = async (accessToken: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      isAdmin.value = res.data.isAdmin
      user.value = res.data.user

      localStorage.setItem('is_streamer_admin', res.data.isAdmin)
      localStorage.setItem('twitch_user', JSON.stringify(res.data.user))
    } catch (err) {
      logout() // Si el token expiró o falló, deslogueamos por seguridad
    }
  }

  const checkHashToken = async () => {
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', '?'))
      const accessToken = params.get('access_token')
      if (accessToken) {
        token.value = accessToken
        localStorage.setItem('twitch_token', accessToken)
        window.location.hash = ''
        await verifyIdentity(accessToken)
      }
    }
  }

  const triggerAlert = () => {
    Swal.fire({
      title: '¡ALTO AHÍ, CAZADOR!',
      text: 'Tenés que iniciar sesión con Twitch para poder votar. ¡No seas laucha! 👾☕',
      icon: 'error',
      iconColor: '#ff007f',
      background: '#0b0813',
      color: '#ffffff',
      confirmButtonText: '¡DE UNA, ME LOGUEO!',
      showCancelButton: true,
      cancelButtonText: 'DESPUÉS',
      customClass: {
        popup: 'border-2 border-synth-pink shadow-neon-pink rounded-xl font-mono',
        confirmButton:
          'bg-synth-pink text-slate-950 font-black px-6 py-3 rounded-lg m-2 tracking-wide hover:shadow-neon-pink transition-all duration-300',
        cancelButton:
          'bg-transparent border border-slate-700 text-slate-400 font-bold px-6 py-3 rounded-lg m-2 hover:text-white transition-all duration-300',
      },
      buttonsStyling: false, // Desactivamos el estilo nativo para que aplique nuestras clases
    }).then((result) => {
      if (result.isConfirmed) {
        login() // Si toca el botón fucsia, lo mandamos directo a loguearse
      }
    })
  }

  return {
    token,
    isAdmin,
    user,
    login,
    logout,
    checkHashToken,
    triggerAlert,
    verifyIdentity,
  }
}
