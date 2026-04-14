<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Collaboration from '@tiptap/extension-collaboration';
import Underline from '@tiptap/extension-underline';
import { TextStyle, FontSize }  from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import { Awareness } from 'y-protocols/awareness';
import * as awarenessProtocol from 'y-protocols/awareness';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { Color } from '@tiptap/extension-color';
import { ref } from 'vue';

const props = defineProps<{
  documentId: string;
}>();

const ydoc = new Y.Doc();
const socket = io('http://localhost:3000');

socket.emit('join-document', props.documentId);

socket.on('sync-document', (fullState: ArrayBuffer) => {
  Y.applyUpdate(ydoc, new Uint8Array(fullState));
});

ydoc.on('update', (update: Uint8Array) => {
  socket.emit('crdt-update', { 
    documentId: props.documentId, 
    update 
  });
});

socket.on('crdt-update', (update: ArrayBuffer) => {
  Y.applyUpdate(ydoc, new Uint8Array(update));
});

// AWARENESS PER MULTI-CURSORI
const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
const awareness = new Awareness(ydoc);
const provider = { awareness };

socket.on('awareness-update', (update: ArrayBuffer) => {
  awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), socket);
});

awareness.on('update', ({ added, updated, removed }: any) => {
  const changedClients = added.concat(updated, removed);
  const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
  socket.emit('awareness-update', { documentId: props.documentId, update });
});

// Palette Colori
type HexColor = string;

const predefinedColors: HexColor[] = [
  '#000000', '#434343', '#666666', '#999999', // Scala di grigi
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', // Rossi/Viola
  '#3F51B5', '#2196F3', '#00BCD4', '#009688', // Blu/Azzurri
  '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', // Verdi/Gialli
  '#FF9800', '#FF5722', '#795548', '#607D8B'  // Aranci/Marroni
];

const showColorPalette = ref<boolean>(false);

// Metodo per applicare il colore e chiudere la palette
const applyColor = (color: HexColor) => {
  if (editor.value) {
    editor.value.chain().focus().setColor(color).run();
  }
  showColorPalette.value = false; // Nascondi la palette dopo la selezione
};
// Fine palette colori

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      undoRedo: false,
    }),
    Collaboration.configure({
      document: ydoc,
    }),
    CollaborationCaret.configure({
      provider,
      user: {
        name: 'Utente ' + Math.floor(Math.random() * 1000),
        color: getRandomColor(),
      },
    }),

    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Underline,
    TextStyle,
    FontSize,
    FontFamily,
    Color.configure({ types: ['textStyle'] }),
  ],
  editorProps: {
    attributes: {
      class: 'prose focus:outline-none',
    },
  },
});

onBeforeUnmount(() => {
  if (socket) {
    socket.emit('leave-document', props.documentId);
    socket.disconnect();
  }
  if (ydoc) {
    ydoc.destroy();
  }
});
</script>

<template>
  <div class="editor-wrapper" v-if="editor">
    <div class="toolbar">
      <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" title="Annulla">
        ⟲
      </button>
      <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" title="Ripeti">
        ⟳
      </button>

      <div class="divider"></div>

      <select class="toolbar-select" @change="e => {
        const val = (e.target as HTMLSelectElement).value;
        if (val === 'p') editor?.chain().focus().setParagraph().run();
        else editor?.chain().focus().toggleHeading({ level: parseInt(val) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
      }">
        <option value="p" :selected="editor.isActive('paragraph')">Testo normale</option>
        <option value="1" :selected="editor.isActive('heading', { level: 1 })">Titolo 1</option>
        <option value="2" :selected="editor.isActive('heading', { level: 2 })">Titolo 2</option>
        <option value="3" :selected="editor.isActive('heading', { level: 3 })">Titolo 3</option>
      </select>

      <div class="divider"></div>

      <select class="toolbar-select" @change="e => editor?.chain().focus().setFontFamily((e.target as HTMLSelectElement).value).run()">
        <option value="Arial" :selected="editor.isActive('textStyle', { fontFamily: 'Arial' })">Arial</option>
        <option value="Georgia" :selected="editor.isActive('textStyle', { fontFamily: 'Georgia' })">Georgia</option>
        <option value="Times New Roman" :selected="editor.isActive('textStyle', { fontFamily: 'Times New Roman' })">Times</option>
      </select>

      <div class="divider"></div>

      <input type="number" class="toolbar-input" :value="editor.getAttributes('textStyle').fontSize?.replace(/[pxt]+/g, '') || 11" min="8" max="72" title="Dimensione carattere" @change="e => editor?.chain().focus().setFontSize(`${(e.target as HTMLInputElement).value}pt`).run()" />

      <div class="divider"></div>

      <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" title="Grassetto" >
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
      </button>
      <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" title="Corsivo">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
      </button>
      <button @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'is-active': editor.isActive('underline') }" title="Sottolineato">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
      </button>
      <button 
        @click="showColorPalette = !showColorPalette" 
        :class="{ 'is-active': showColorPalette }"
        title="Colore testo"
      >
        <span 
          class="color-indicator" 
          :style="{ borderBottomColor: editor?.getAttributes('textStyle').color || '#000000' }"
        >
          A
        </span>
      </button>
      <div class="divider"></div>

      <button @click="editor.chain().focus().setTextAlign('left').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }" title="Allinea a sinistra">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 21v-2h18v2zm0-4v-2h12v2zm0-4v-2h18v2zm0-4V7h12v2zm0-4V3h18v2z"/></svg>
      </button>
      <button @click="editor.chain().focus().setTextAlign('center').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }" title="Allinea al centro">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 21v-2h18v2zm4-4v-2h10v2zm-4-4v-2h18v2zm4-4V7h10v2zm-4-4V3h18v2z"/></svg>
      </button>
      <button @click="editor.chain().focus().setTextAlign('right').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }" title="Allinea a destra">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 21v-2h18v2zm6-4v-2h12v2zm-6-4v-2h18v2zm6-4V7h12v2zm-6-4V3h18v2z"/></svg>
      </button>
      <button @click="editor.chain().focus().setTextAlign('justify').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }" title="Giustifica">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 21v-2h18v2zm0-4v-2h18v2zm0-4v-2h18v2zm0-4V7h18v2zm0-4V3h18v2z"/></svg>
      </button>
      <div class="divider"></div>

      <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }" title="Elenco puntato">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M8 20v-2h13v2zM4 21q-.825 0-1.412-.587T2 19q0-.825.588-1.412T4 17q.825 0 1.413.588T6 19q0 .825-.587 1.413T4 21m4-7v-2h13v2zM4 14q-.825 0-1.412-.587T2 12q0-.825.588-1.412T4 10q.825 0 1.413.588T6 12q0 .825-.587 1.413T4 14m4-7V5h13v2zM4 7q-.825 0-1.412-.587T2 5q0-.825.588-1.412T4 3q.825 0 1.413.588T6 5q0 .825-.587 1.413T4 7"/></svg>
      </button>
      <button @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }" title="Elenco numerato">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
      </button>
    </div>

    <!-- Palette fluttuante fuori dalla toolbar principale -->
    <div v-if="showColorPalette" class="color-palette-bar">
      <button
        v-for="color in predefinedColors"
        :key="color"
        class="color-swatch"
        :style="{ backgroundColor: color }"
        @click="applyColor(color)"
      ></button>
    </div>

    <div class="document-page" @click="editor?.commands.focus()">
      <EditorContent :editor="editor" class="editor-content" />
    </div>
  </div>
</template>

<style scoped>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f8f9fa; 
  min-height: 100vh;
  padding-top: 1rem;
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
  font-size: 1rem;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444746;
  transition: background-color 0.2s ease;
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

.toolbar-select, .toolbar-input {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0.3rem;
  font-size: 0.9rem;
  color: #444746;
  cursor: pointer;
}
.toolbar-select:hover, .toolbar-input:hover {
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

.document-page {
  background: white;
  width: 100%;
  max-width: 21cm;
  min-height: 29.7cm;
  padding: 2.5cm;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  border-radius: 2px;
  margin-bottom: 2rem;
  text-align: left;
  cursor: text; 
}

:deep(.ProseMirror) {
  min-height: 24cm;
  outline: none;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #000000;
}

:deep(.ProseMirror p) {
  margin-top: 0;
  margin-bottom: 1rem;
}

:deep(.ProseMirror:focus) {
  outline: none;
}

:deep(.ProseMirror u) {
  text-decoration: underline !important;
}

:deep(.collaboration-cursor__caret),
:deep(.collaboration-carets__caret) {
  border-left: 1px solid #0d0d0d;
  border-right: 1px solid #0d0d0d;
  margin-left: -1px;
  margin-right: -1px;
  pointer-events: none;
  position: relative;
  word-break: normal;
}

:deep(.collaboration-cursor__label),
:deep(.collaboration-carets__label) {
  border-radius: 3px 3px 3px 0;
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  left: -1px;
  line-height: normal;
  padding: 0.1rem 0.3rem;
  position: absolute;
  top: -1.3em;
  user-select: none;
  white-space: nowrap;
}

/* Stile per la "A" col trattino colorato sotto */
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

/* Contenitore della palette - appare come una barra secondaria */
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

/* I singoli quadratini di colore - Grandezza ottimizzata per il touch (Mobile) */
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.1s;
}

.color-swatch:hover, .color-swatch:active {
  transform: scale(1.1);
  border-color: rgba(0,0,0,0.3);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .document-page {
    padding: 1rem;
    min-height: calc(100vh - 100px);
  }
}
</style>