<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  name: string;
  size?: string | number;
  color?: string;
}>();

const iconSize = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size || '20px'));

const icons: Record<string, any> = {
  bold: 'M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z',
  italic: 'M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z',
  underline: 'M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z',
  alignLeft: 'M3 21v-2h18v2zm0-4v-2h12v2zm0-4v-2h18v2zm0-4V7h12v2zm0-4V3h18v2z',
  alignCenter: 'M3 21v-2h18v2zm4-4v-2h10v2zm-4-4v-2h18v2zm4-4V7h10v2zm-4-4V3h18v2z',
  alignRight: 'M3 21v-2h18v2zm6-4v-2h12v2zm-6-4v-2h18v2zm6-4V7h12v2zm-6-4V3h18v2z',
  alignJustify: 'M3 21v-2h18v2zm0-4v-2h18v2zm0-4v-2h18v2zm0-4V7h18v2zm0-4V3h18v2z',
  bulletList: 'M8 20v-2h13v2zM4 21q-.825 0-1.412-.587T2 19q0-.825.588-1.412T4 17q.825 0 1.413.588T6 19q0 .825-.587 1.413T4 21m4-7v-2h13v2zM4 14q-.825 0-1.412-.587T2 12q0-.825.588-1.412T4 10q.825 0 1.413.588T6 12q0 .825-.587 1.413T4 14m4-7V5h13v2zM4 7q-.825 0-1.412-.587T2 5q0-.825.588-1.412T4 3q.825 0 1.413.588T6 5q0 .825-.587 1.413T4 7',
  orderedList: 'M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z',
  highlight: 'M544-400 440-504 240-304l104 104 200-200Zm-47-161 104 104 199-199-104-104-199 199Zm-84-28 216 216-229 229q-24 24-56 24t-56-24l-2-2-26 26H60l126-126-2-2q-24-24-24-56t24-56l229-229Zm0 0 227-227q24-24 56-24t56 24l104 104q24 24 24 56t-24 56L629-373 413-589Z',
  users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  file: 'M13 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9l-7-7zM6 20V4h6v5h5v11H6z',
  trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'
};

const path = computed(() => icons[props.name] || '');
</script>

<template>
  <svg 
    :width="iconSize" 
    :height="iconSize" 
    viewBox="0 0 24 24" 
    v-if="name !== 'highlight'"
  >
    <path :fill="color || 'currentColor'" :d="path" />
  </svg>
  <svg 
    v-else
    :width="iconSize" 
    :height="iconSize" 
    viewBox="0 -960 960 960"
  >
    <path :fill="color || 'currentColor'" :d="path" />
  </svg>
</template>
