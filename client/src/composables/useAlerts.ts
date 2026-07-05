import Swal from 'sweetalert2'

export function useAlerts() {
  // Alerta de éxito cuando el voto se registra correctamente
  const showVoteSuccess = () => {
    return Swal.fire({
      title: '¡VOTO REGISTRADO!',
      text: 'Tu voto fue computado en la Matrix. ¡Gracias por bancar!',
      icon: 'success',
      iconColor: '#00f0ff',
      background: '#0b0813',
      color: '#ffffff',
      confirmButtonText: '¡GENIAL!',
      customClass: {
        popup: 'border-2 border-synth-cyan shadow-neon-cyan rounded-xl font-mono',
        confirmButton:
          'bg-synth-cyan text-slate-950 font-black px-6 py-3 rounded-lg tracking-wide hover:shadow-neon-cyan transition-all duration-300',
      },
      buttonsStyling: false,
    })
  }

  // Alerta informativa cuando el usuario retira su voto
  const showVoteRemoved = () => {
    return Swal.fire({
      title: 'VOTO RETIRADO',
      text: 'Removimos tu voto del juego. Podés elegir cualquier otro cuando quieras.',
      icon: 'info',
      iconColor: '#9d4edd',
      background: '#0b0813',
      color: '#ffffff',
      confirmButtonText: 'ENTENDIDO',
      customClass: {
        popup: 'border-2 border-synth-purple shadow-neon-purple rounded-xl font-mono',
        confirmButton:
          'bg-synth-purple text-white font-black px-6 py-3 rounded-lg tracking-wide hover:shadow-neon-purple transition-all duration-300',
      },
      buttonsStyling: false,
    })
  }

  // Alerta genérica de error (por si falla la API o cae el servidor)
  const showError = (message: string) => {
    return Swal.fire({
      title: '¡EPA!',
      text: message || 'Algo salió mal al procesar el voto.',
      icon: 'error',
      iconColor: '#ff007f',
      background: '#0b0813',
      color: '#ffffff',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'border-2 border-synth-pink shadow-neon-pink rounded-xl font-mono',
        confirmButton:
          'bg-synth-pink text-slate-950 font-black px-6 py-3 rounded-lg tracking-wide hover:shadow-neon-pink transition-all duration-300',
      },
      buttonsStyling: false,
    })
  }

  return {
    showVoteSuccess,
    showVoteRemoved,
    showError,
  }
}
