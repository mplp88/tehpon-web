<script setup lang="ts">
const socialLinks = [
  { name: 'Twitch', url: 'https://www.twitch.tv/tehpon', icon: 'fab fa-twitch', color: '#9146ff' },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@tehpon',
    icon: 'fab fa-youtube',
    color: '#ff0000',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/tehpontv',
    icon: 'fab fa-instagram',
    color: '#e4405f',
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@tehpontv',
    icon: 'fab fa-tiktok',
    color: '#ff0050',
  },
  {
    name: 'Discord',
    url: 'https://discord.com/invite/KGbT45t6Ca',
    icon: 'fab fa-discord',
    color: '#5865f2',
  },
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
        <i :class="[link.icon, 'text-2xl mr-4']" :style="{ color: link.color }"></i>
        <span>{{ link.name }}</span>
      </a>

      <hr class="border-synth-purple/30 my-6" />

      <a
        href="https://cafecito.app/tehpon"
        target="_blank"
        class="block w-full py-3 px-4 bg-synth-pink border border-transparent rounded-lg text-slate-950 font-black tracking-wider transition-all duration-300 hover:bg-transparent hover:border-synth-pink hover:text-synth-pink hover:shadow-neon-pink"
      >
        <i class="fas fa-coffee mr-3 text-xl group-hover:animate-pulse"></i><span>CAFECITO</span>
      </a>

      <a
        href="https://paypal.me/tehpon"
        target="_blank"
        class="block w-full py-3 px-4 bg-transparent border border-synth-cyan rounded-lg text-synth-cyan font-bold tracking-wider transition-all duration-300 hover:bg-synth-cyan hover:text-slate-950 hover:shadow-neon-cyan"
      >
        <i class="fab fa-paypal mr-3 text-xl"></i><span>PAYPAL</span>
      </a>
    </div>
  </div>
</template>
