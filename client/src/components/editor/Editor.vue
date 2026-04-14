<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Collaboration from '@tiptap/extension-collaboration';
import Underline from '@tiptap/extension-underline';
import { TextStyle, FontSize }  from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import EditorToolbar from './EditorToolbar.vue';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import { Awareness } from 'y-protocols/awareness';
import * as awarenessProtocol from 'y-protocols/awareness';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { useAuthStore } from '../../stores/auth.store.js';

const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost';

const props = defineProps<{
  documentId: string;
}>();

const authStore = useAuthStore();
const ydoc = new Y.Doc();
//const socket = io('http://localhost:3000');

const socket = io(wsUrl, {
  query: {
    documentId: props.documentId
  },
  auth: {
    token: authStore.token 
  }
});

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

// Solo logic Tiptap ed Yjs di seguito:

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      undoRedo: false,
    }),
    Collaboration.configure({
      document: ydoc,
    }),
    CollaborationCaret.configure({
      provider: provider,
      user: {
        name: authStore.user?.username || authStore.user?.email || 'Utente',
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
    Highlight.configure({ multicolor: true }),
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
    <EditorToolbar :editor="editor" />

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
  padding: 1rem;
}

.document-page {
  background: white;
  width: 100%;
  max-width: 850px;
  min-height: 100vh;
  padding: 4rem 3rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  border-radius: 2px;
  margin-bottom: 2rem;
  text-align: left;
  cursor: text; 
}

/*
:deep(.ProseMirror) {
  min-height: 24cm;
  outline: none;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #000000;
}
*/

:deep(.ProseMirror) {
  min-height: 600px;
  outline: none;
  font-family: Arial, sans-serif;
  line-height: 1.6;
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

/*
@media (max-width: 768px) {
  .document-page {
    padding: 1rem;
    min-height: calc(100vh - 100px);
  }
}
*/

@media screen and (max-width: 768px) {
  .editor-wrapper {
    padding: 0;
    background-color: #fff;
  }

  .document-page {
    padding: 1.5rem;
    box-shadow: none;
    max-width: 100%;
    margin-bottom: 0;
    border-radius: 0;
  }

  :deep(.ProseMirror) {
    min-height: calc(100vh - 120px);
    font-size: 16px;
  }
}

</style>