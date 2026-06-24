<script setup lang="ts">
import { ref } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import { PREDEFINED_COLORS } from '../../constants/colors';
import BaseIcon from '../common/BaseIcon.vue';

const props = defineProps<{
  editor: Editor | null;
}>();

const showColorPalette = ref<boolean>(false);
const showHighlightPalette = ref<boolean>(false);

const applyColor = (color: string) => {
  props.editor?.chain().focus().setColor(color).run();
  showColorPalette.value = false;
};

const applyHighlight = (color: string) => {
  if (!color) {
    props.editor?.chain().focus().unsetHighlight().run();
  } else {
    props.editor?.chain().focus().setHighlight({ color }).run();
  }
  showHighlightPalette.value = false;
};

const handleHeadingChange = (event: Event) => {
  const val = (event.target as HTMLSelectElement).value;
  if (val === 'p') {
    props.editor?.chain().focus().setParagraph().run();
  } else {
    props.editor?.chain().focus().toggleHeading({ level: parseInt(val) as any }).run();
  }
};

const handleFontFamilyChange = (event: Event) => {
  const val = (event.target as HTMLSelectElement).value;
  props.editor?.chain().focus().setFontFamily(val).run();
};

const handleFontSizeChange = (event: Event) => {
  const val = (event.target as HTMLInputElement).value;
  props.editor?.chain().focus().setFontSize(`${val}pt`).run();
};

const executeCommand = (action: () => void) => {
  if (props.editor?.isEditable) {
    action();
  }
};
</script>

<template>
  <div v-if="editor" class="toolbar-container">
    <div class="toolbar">
      <button @click="executeCommand(() => editor?.chain().focus().undo().run())" :disabled="!editor.can().undo()" title="Annulla">⟲</button>
      <button @click="executeCommand(() => editor?.chain().focus().redo().run())" :disabled="!editor.can().redo()" title="Ripeti">⟳</button>

      <div class="divider"></div>

      <select class="toolbar-select" @change="handleHeadingChange">
        <option value="p" :selected="editor.isActive('paragraph')">Testo normale</option>
        <option value="1" :selected="editor.isActive('heading', { level: 1 })">Titolo 1</option>
        <option value="2" :selected="editor.isActive('heading', { level: 2 })">Titolo 2</option>
        <option value="3" :selected="editor.isActive('heading', { level: 3 })">Titolo 3</option>
      </select>

      <div class="divider"></div>

      <select class="toolbar-select" @change="handleFontFamilyChange">
        <option value="Arial" :selected="editor.isActive('textStyle', { fontFamily: 'Arial' })">Arial</option>
        <option value="Georgia" :selected="editor.isActive('textStyle', { fontFamily: 'Georgia' })">Georgia</option>
        <option value="Times New Roman" :selected="editor.isActive('textStyle', { fontFamily: 'Times New Roman' })">Times</option>
      </select>

      <div class="divider"></div>

      <input 
        type="number" 
        class="toolbar-input" 
        :value="editor.getAttributes('textStyle').fontSize?.replace(/[pxt]+/g, '') || 11" 
        min="8" max="72" 
        @change="handleFontSizeChange"
        title="Dimensione carattere" 
      />

      <div class="divider"></div>

      <button @click="executeCommand(() => editor?.chain().focus().toggleBold().run())" :class="{ 'is-active': editor.isActive('bold') }" title="Grassetto">
        <BaseIcon name="bold" />
      </button>
      <button @click="executeCommand(() => editor?.chain().focus().toggleItalic().run())" :class="{ 'is-active': editor.isActive('italic') }" title="Corsivo">
        <BaseIcon name="italic" />
      </button>
      <button @click="executeCommand(() => editor?.chain().focus().toggleUnderline().run())" :class="{ 'is-active': editor.isActive('underline') }" title="Sottolineato">
        <BaseIcon name="underline" />
      </button>

      <div class="divider"></div>

      <button @click="showColorPalette = !showColorPalette; showHighlightPalette = false" :class="{ 'is-active': showColorPalette }" title="Colore testo">
        <span class="color-indicator" :style="{ borderBottomColor: editor.getAttributes('textStyle').color || '#000000' }">A</span>
      </button>
      <button @click="showHighlightPalette = !showHighlightPalette; showColorPalette = false" :class="{ 'is-active': showHighlightPalette }" title="Colore evidenziatore">
        <BaseIcon name="highlight" :color="editor.getAttributes('highlight').color" />
      </button>

      <div class="divider"></div>

      <button @click="executeCommand(() => editor?.chain().focus().setTextAlign('left').run())" :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }" title="Allinea a sinistra">
        <BaseIcon name="alignLeft" size="18" />
      </button>
      <button @click="executeCommand(() => editor?.chain().focus().setTextAlign('center').run())" :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }" title="Allinea al centro">
        <BaseIcon name="alignCenter" size="18" />
      </button>
      <button @click="executeCommand(() => editor?.chain().focus().setTextAlign('right').run())" :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }" title="Allinea a destra">
        <BaseIcon name="alignRight" size="18" />
      </button>
      <button @click="executeCommand(() => editor?.chain().focus().setTextAlign('justify').run())" :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }" title="Giustifica">
        <BaseIcon name="alignJustify" size="18" />
      </button>

      <div class="divider"></div>

      <button @click="executeCommand(() => editor?.chain().focus().toggleBulletList().run())" :class="{ 'is-active': editor.isActive('bulletList') }" title="Elenco puntato">
        <BaseIcon name="bulletList" size="18" />
      </button>
      <button @click="executeCommand(() => editor?.chain().focus().toggleOrderedList().run())" :class="{ 'is-active': editor.isActive('orderedList') }" title="Elenco numerato">
        <BaseIcon name="orderedList" size="18" />
      </button>
    </div>

    <div v-if="showColorPalette" class="color-palette-bar">
      <button
        v-for="color in PREDEFINED_COLORS"
        :key="'text-'+color"
        class="color-swatch"
        :style="{ backgroundColor: color }"
        @click="applyColor(color)"
      ></button>
    </div>

    <div v-if="showHighlightPalette" class="color-palette-bar">
      <button class="color-swatch no-color" title="Nessun colore" @click="applyHighlight('')"></button>
      <button
        v-for="color in PREDEFINED_COLORS"
        :key="'bg-'+color"
        class="color-swatch"
        :style="{ backgroundColor: color }"
        @click="applyHighlight(color)"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.toolbar-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.toolbar {
  display: flex;
  align-items: center;
  background: #edf2fa;
  padding: 0.4rem 1rem;
  border-radius: 40px;
  margin-bottom: 2rem;
  position: sticky;
  top: 1rem;
  z-index: 10;
  max-width: 95vw;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
}

.toolbar::-webkit-scrollbar {
  display: none;
}

.toolbar button {
  border: none;
  background: transparent;
  padding: 0.4rem;
  margin: 0 0.1rem;
  border-radius: 4px;
  cursor: pointer;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444746;
  transition: all 0.2s ease;
}

.toolbar button:hover:not(:disabled) {
  background-color: #e1e5ea;
}

.toolbar button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar button.is-active {
  background-color: #d3e3fd;
  color: #0b57d0;
}

.toolbar-select, 
.toolbar-input {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0.3rem;
  font-size: 0.9rem;
  color: #444746;
  cursor: pointer;
}

.toolbar-select:hover, 
.toolbar-input:hover {
  background-color: #e1e5ea;
}

.toolbar-input {
  width: 50px;
  text-align: center;
}

.divider {
  width: 1px;
  height: 20px;
  background-color: #c7c7c7;
  margin: 0 0.5rem;
  flex-shrink: 0;
}

.color-indicator {
  font-family: 'Times New Roman', serif;
  font-size: 1.1rem;
  font-weight: bold;
  color: #444746;
  border-bottom: 3px solid #000000;
  padding-bottom: 1px;
  line-height: 1;
  display: inline-block;
}

.color-palette-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #e1e5ea;
  border-radius: 8px;
  max-width: 95vw;
  margin-top: -1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  animation: slideDown 0.2s ease-out;
  position: sticky;
  top: 4.5rem;
  z-index: 9;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.1s;
}

.color-swatch:hover {
  transform: scale(1.1);
  border-color: rgba(0,0,0,0.3);
}

.color-swatch.no-color {
  background-color: transparent;
  border: 1px dashed #ccc;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
