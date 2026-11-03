<script setup lang="ts">
import { SPECIES, type Species } from '../game/model'
defineProps<{ species: Species; happy?: boolean }>()
</script>
<template>
  <svg viewBox="0 0 120 120" class="creature-art" :class="{ happy }" aria-hidden="true">
    <ellipse cx="60" cy="105" rx="30" ry="7" fill="#34334d" opacity=".09"/>
    <g class="creature-body">
      <path v-if="species === 'momo'" d="M61 38Q29 34 35 11Q60 9 61 38Q61 15 86 17Q88 38 61 38" fill="#779b67"/>
      <g v-if="species === 'lumi'" :fill="SPECIES[species].color"><path d="M37 54Q12 19 29 13Q46 18 47 49M73 49Q77 15 93 16Q106 25 85 56"/><path d="M40 48Q29 27 30 24M80 48Q89 29 90 25" stroke="#9990cb" stroke-width="5" stroke-linecap="round"/></g>
      <g v-if="species === 'pipi'" fill="#d5959c"><path d="M35 56Q17 34 34 32L49 49M72 48Q91 25 97 43L86 59"/><path d="M53 37Q49 12 67 20Q77 30 62 43"/></g>
      <ellipse cx="44" cy="99" rx="13" ry="7" :fill="SPECIES[species].dark"/><ellipse cx="77" cy="99" rx="13" ry="7" :fill="SPECIES[species].dark"/>
      <path d="M27 73C26 47 39 33 61 34C86 35 99 56 96 78C94 98 78 105 58 103C37 102 25 94 27 73" :fill="SPECIES[species].color"/>
      <ellipse cx="62" cy="83" rx="21" ry="17" fill="white" opacity=".21"/>
      <ellipse cx="35" cy="77" rx="5" ry="11" :fill="SPECIES[species].color"/><ellipse cx="91" cy="77" rx="5" ry="11" :fill="SPECIES[species].color"/>
      <path v-if="happy" d="m44 66 5-4 5 4m16 0 5-4 5 4" stroke="#414452" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g v-else fill="#414452"><ellipse cx="49" cy="65" rx="3.5" ry="5"/><ellipse cx="76" cy="65" rx="3.5" ry="5"/><circle cx="50" cy="63" r="1.2" fill="white"/><circle cx="77" cy="63" r="1.2" fill="white"/></g>
      <path d="M58 75q5 6 10-1" stroke="#53505b" stroke-width="2.3" fill="none" stroke-linecap="round"/>
      <ellipse cx="40" cy="74" rx="6" ry="3.2" fill="#ed969e" opacity=".6"/><ellipse cx="84" cy="74" rx="6" ry="3.2" fill="#ed969e" opacity=".6"/>
      <path d="M37 52q3-8 12-10" fill="none" stroke="white" opacity=".3" stroke-width="5" stroke-linecap="round"/>
    </g>
  </svg>
</template>
