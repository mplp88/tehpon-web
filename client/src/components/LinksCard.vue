<script setup lang="ts">
const socialLinks = [
  { name: 'Twitch', url: 'https://www.twitch.tv/tehpon' },
  { name: 'YouTube', url: 'https://www.youtube.com/@tehpon' },
  { name: 'Instagram', url: 'https://www.instagram.com/tehpontv' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@tehpontv' },
]
</script>

<template>
  <div
    class="bg-slate-900/80 backdrop-blur-md border border-synth-purple p-6 rounded-xl shadow-neon-purple text-center"
  >
    <h2
      class="text-2xl font-bold text-synth-cyan shadow-neon-cyan mb-6 tracking-widest uppercase py-3"
    >
      Mis redes
    </h2>
    <div class="space-y-4">
      <a
        v-for="link in socialLinks"
        :key="link.name"
        :href="link.url"
        target="_blank"
        class="block w-full py-3 px-4 bg-slate-950/60 border border-synth-cyan/40 rounded-lg text-white font-semibold transition-all duration-300 hover:border-synth-cyan hover:shadow-neon-cyan hover:-translate-y-0.5"
      >
        {{ link.name }}
      </a>

      <hr class="border-synth-purple/30 my-6" />

      <a
        href="https://cafecito.app/tu-usuario"
        target="_blank"
        class="block w-full py-3 px-4 bg-synth-pink border border-transparent rounded-lg text-slate-950 font-black tracking-wider transition-all duration-300 hover:bg-transparent hover:border-synth-pink hover:text-synth-pink hover:shadow-neon-pink"
      >
        ☕ CAFECITO
      </a>

      <a
        href="https://paypal.me/tu-usuario"
        target="_blank"
        class="block w-full py-3 px-4 bg-transparent border border-synth-cyan rounded-lg text-synth-cyan font-bold tracking-wider transition-all duration-300 hover:bg-synth-cyan hover:text-slate-950 hover:shadow-neon-cyan"
      >
        💳 PAYPAL
      </a>
    </div>
  </div>
</template>
