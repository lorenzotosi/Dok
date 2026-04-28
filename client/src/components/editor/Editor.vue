<script setup lang="ts">
import { computed, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Collaboration from '@tiptap/extension-collaboration';
import Underline from '@tiptap/extension-underline';
import { TextStyle, FontSize }  from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import EditorToolbar from './EditorToolbar.vue';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { useAuthStore } from '../../stores/auth.store';
import { useCollaboration } from '../../composables/useCollaboration';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import AIBubbleMenu from './BubbleMenu.vue';

const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

const props = defineProps<{
  documentId: string;
  ownerId: string;
  sharedWith?: any[];
}>();

const authStore = useAuthStore();

const { ydoc, provider, activeUsers, getRandomColor } = useCollaboration(
  props.documentId, 
  wsUrl, 
  authStore.token || undefined
);

defineExpose({ activeUsers });

const canEdit = computed(() => {
  if (!authStore.isAuthenticated()) return false;
  if (props.ownerId === authStore.user?.id) return true;
  return props.sharedWith?.some(s => 
    (s.userId?._id || s.userId) === authStore.user?.id && s.role === 'editor'
  ) ?? false;
});

const editor = useEditor({
  editable: canEdit.value,
  extensions: [
    StarterKit.configure({
      undoRedo: false,
    }),
    BubbleMenu,
    Collaboration.configure({
      document: ydoc,
    }),
    CollaborationCaret.configure({
      provider: provider,
      user: {
        name: authStore.user?.firstName + ' ' + authStore.user?.lastName || 'Utente' + Math.random().toString(36).substring(2, 7),
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

watch(canEdit, (newEditableState) => {
  if (editor.value) {
    editor.value.setEditable(newEditableState);
  }
});

</script>

<template>
  <div class="editor-wrapper" v-if="editor">
    <EditorToolbar :editor="editor" />

    <AIBubbleMenu v-if="canEdit" :editor="editor" />
    <div class="document-page" @click="editor.isEditable && editor.commands.focus()">
      <EditorContent :editor="editor" class="editor-content" />
    </div>
  </div>
</template>

<style scoped>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: transparent; 
  width: 100%;
  padding: 1rem;
}

.document-page {
  background: white;
  width: 100%;
  max-width: 850px;
  min-height: 1100px;
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