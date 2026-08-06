<script setup lang="ts">
const hero = {
  displayName: 'TehPon',
  class: 'Guerrero',
  level: 5,

  hp: 150,
  maxHp: 150,

  exp: 240,
  nextLevelExp: 500,

  gold: 250,

  stats: {
    fuerza: 15,
    vitalidad: 20,
    destreza: 8,
    inteligencia: 5,
    defense: 7,
    spDefense: 2,
    critMultiplier: 1.2,
  },

  inventory: {
    weapon: 'Espada de Hierro',
    armor: 'Ropa de Aventurero',
    accessory: 'Ninguno',
  },

  sprite: '/sprites/warrior-front.png',
  background: '/backgrounds/forest.png',
}
</script>

<template>
  <div class="min-h-screen bg-stone-900 flex items-center justify-center p-8">
    <div
      class="w-105 rounded-xl border-8 border-yellow-700 bg-amber-100 shadow-2xl overflow-hidden"
    >
      <!-- HEADER -->

      <div class="bg-yellow-700 text-yellow-100 px-4 py-3">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">
              {{ hero.displayName }}
            </h1>

            <p class="text-sm opacity-90">Nivel {{ hero.level }}</p>
          </div>

          <div class="text-right">❤️ {{ hero.hp }}/{{ hero.maxHp }}</div>
        </div>
      </div>

      <!-- ARTWORK -->

      <div class="relative h-72 border-y-4 border-yellow-700 overflow-hidden">
        <img :src="hero.background" class="absolute inset-0 w-full h-full object-cover" />

        <img
          :src="hero.sprite"
          class="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 image-rendering-pixelated"
        />
      </div>

      <!-- CLASE -->

      <div class="bg-yellow-200 text-center py-2 font-bold text-lg">🛡 {{ hero.class }}</div>

      <!-- STATS -->

      <div class="grid grid-cols-2 gap-x-6 gap-y-2 p-5 text-sm">
        <div>⚔ Fuerza</div>
        <div class="text-right">{{ hero.stats.fuerza }}</div>

        <div>❤️ Vitalidad</div>
        <div class="text-right">{{ hero.stats.vitalidad }}</div>

        <div>🏹 Destreza</div>
        <div class="text-right">{{ hero.stats.destreza }}</div>

        <div>✨ Inteligencia</div>
        <div class="text-right">{{ hero.stats.inteligencia }}</div>

        <div>🛡 Defensa</div>
        <div class="text-right">{{ hero.stats.defense }}</div>

        <div>🔮 Def. Mágica</div>
        <div class="text-right">{{ hero.stats.spDefense }}</div>

        <div>💥 Crítico</div>
        <div class="text-right">x{{ hero.stats.critMultiplier }}</div>
      </div>

      <!-- EXP -->

      <div class="px-5">
        <div class="flex justify-between text-sm mb-1">
          <span>Experiencia</span>

          <span> {{ hero.exp }}/{{ hero.nextLevelExp }} </span>
        </div>

        <div class="h-4 bg-stone-300 rounded">
          <div
            class="h-full bg-blue-600 rounded"
            :style="{
              width: `${(hero.exp / hero.nextLevelExp) * 100}%`,
            }"
          ></div>
        </div>
      </div>

      <!-- GOLD -->

      <div class="px-5 mt-4 text-lg">💰 {{ hero.gold }} Oro</div>

      <!-- EQUIP -->

      <div class="p-5 border-t mt-5">
        <div class="mb-3">
          <div class="font-bold">⚔ Arma</div>
          <div>{{ hero.inventory.weapon }}</div>
        </div>

        <div class="mb-3">
          <div class="font-bold">🛡 Armadura</div>
          <div>{{ hero.inventory.armor }}</div>
        </div>

        <div>
          <div class="font-bold">💍 Accesorio</div>
          <div>{{ hero.inventory.accessory }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-rendering-pixelated {
  image-rendering: pixelated;
}
</style>
