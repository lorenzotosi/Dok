<script setup lang="ts">
import { ref } from 'vue';
import { type Editor } from '@tiptap/vue-3';
import { BubbleMenu } from '@tiptap/vue-3/menus';
import { aiService } from '../../services/ai.service';

const props = defineProps<{
  editor: Editor | null;
}>();

const aiPrompt = ref('');
const isLoading = ref(false);

const shouldShow = ({ from, to }: any) => {
  // Mostra se c'è una selezione di testo non vuota
  return from !== to;
};

const handleRewrite = async () => {
  if (!props.editor || isLoading.value) return;

  const prompt = aiPrompt.value.trim() || 'Riscrivi il testo in modo più professionale e chiaro.';
  
  const { from, to } = props.editor.state.selection;
  const selectedText = props.editor.state.doc.textBetween(from, to, '\n');

  if (!selectedText) return;

  isLoading.value = true;
  try {
    // 2. Chiama il backend
    const newText = await aiService.rewriteText(selectedText, prompt);

    // 3. Sostituisci il testo nell'editor in modo reattivo
    // Usiamo chain() per mantenere il focus e preservare la history
    props.editor
      .chain()
      .focus()
      .insertContentAt({ from, to }, newText)
      .run();
      
    aiPrompt.value = ''; // Reset
  } catch (error) {
    // Qui potresti emettere un evento per mostrare un toast/notifica di errore
    alert('Errore durante la generazione del testo.');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <BubbleMenu
    v-if="editor"
    :editor="editor"
    :tippy-options="{ duration: 100, placement: 'top', interactive: true, appendTo: 'parent' }"
    :should-show="shouldShow"
    class="ai-bubble-menu"
  >
    <div class="ai-input-wrapper" @click.stop @mousedown.stop>
      <div class="sparkle-icon">✨</div>
      <input
        :value="aiPrompt"
        @input="aiPrompt = ($event.target as HTMLInputElement).value"
        type="text"
        placeholder="Riscrivi con AI (opzionale)..."
        class="ai-input"
        @keydown.enter.prevent="handleRewrite"
        :disabled="isLoading"
      />
      <button 
        type="button"
        @click="handleRewrite" 
        @mousedown.prevent
        class="ai-submit-btn"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="loader"></span>
        <span v-else>Vai</span>
      </button>
    </div>
  </BubbleMenu>
</template>

<style scoped>
.ai-bubble-menu {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e5ea;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 300px;
}

.ai-input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.sparkle-icon {
  font-size: 1.2rem;
}

.ai-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.4rem;
  font-size: 0.9rem;
  color: #444746;
  background: transparent;
}

.ai-input:disabled {
  opacity: 0.6;
}

.ai-submit-btn {
  background-color: #0b57d0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ai-submit-btn:hover:not(:disabled) {
  background-color: #0842a0;
}

.ai-submit-btn:disabled {
  background-color: #a8c7fa;
  cursor: not-allowed;
}

/* Spinner CSS semplificato */
.loader {
  border: 2px solid #f3f3f3;
  border-top: 2px solid white;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>