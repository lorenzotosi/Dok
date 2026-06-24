<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Editor from '../components/editor/Editor.vue';
import ShareDropdown from '../components/share/ShareDropdown.vue';
import ActiveViewers from '../components/editor/ActiveViewers.vue';
import { useAuthStore } from '../stores/auth.store';
import { useDocumentData } from '../composables/useDocumentData';
import UserMenu from "../components/dashboard/UserMenu.vue";
import { api } from '../services/api';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const documentId = route.params.id as string;

const editorRef = ref<any>(null);
const activeUsers = computed<string[]>(() => editorRef.value?.activeUsers ?? []);

const { documentData, isLoading, fetchDocumentData, handleRename } = useDocumentData(documentId);

const newCommentText = ref('');
const isSubmittingComment = ref(false);

const currentUserRole = computed(() => {
  if (!authStore.isAuthenticated()) return 'viewer';
  const ownerIdStr = documentData.value?.ownerId?._id || documentData.value?.ownerId;
  if (ownerIdStr === authStore.user?.id) {
    return 'owner';
  }
  const share = documentData.value?.sharedWith?.find(
    (s: any) => (s.userId?._id || s.userId) === authStore.user?.id
  );
  return share ? share.role : 'viewer';
});

const canDeleteComment = (comment: any) => {
  const currentUserId = authStore.user?.id;
  if (!currentUserId) return false;
  
  const isCreator = (comment.userId?._id || comment.userId) === currentUserId;
  if (isCreator) return true;
  
  const ownerIdStr = documentData.value?.ownerId?._id || documentData.value?.ownerId;
  const isDocOwner = ownerIdStr === currentUserId;
  if (isDocOwner) return true;
  
  const isEditor = documentData.value?.sharedWith?.some(
    (s: any) => (s.userId?._id || s.userId) === currentUserId && s.role === 'editor'
  );
  return !!isEditor;
  

};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleSendComment = async () => {
  if (!newCommentText.value.trim() || isSubmittingComment.value) return;
  
  isSubmittingComment.value = true;
  try {
    const response = await api.post(`/documents/${documentId}/comments`, {
      content: newCommentText.value.trim()
    });
    
    if (!documentData.value.comments) {
      documentData.value.comments = [];
    }
    if (!documentData.value.comments.some((c: any) => c._id === response.data._id)) {
      documentData.value.comments.push(response.data);
    }
    newCommentText.value = '';
  } catch (error) {
    console.error("Errore durante l'aggiunta del commento:", error);
    alert("Errore durante l'aggiunta del commento");
  } finally {
    isSubmittingComment.value = false;
  }
};

const handleDeleteComment = async (commentId: string) => {
  if (!confirm('Sei sicuro di voler eliminare questo commento?')) return;
  
  try {
    await api.delete(`/documents/${documentId}/comments/${commentId}`);
    
    if (documentData.value && documentData.value.comments) {
      documentData.value.comments = documentData.value.comments.filter(
        (c: any) => c._id !== commentId
      );
    }
  } catch (error) {
    console.error("Errore durante l'eliminazione del commento:", error);
    alert("Errore durante l'eliminazione del commento");
  }
};

onMounted(async () => {
  await fetchDocumentData();
});
</script>

<template>
  <div class="view-container">
    <header class="doc-header">
      <div class="logo-area">
        <button class="icon-btn back-btn" @click="router.push('/')" title="Torna alla Home">←</button>
        <span class="dok-icon">📄</span>
        <div class="doc-title-container" v-if="documentData">
          <input v-if="authStore.isAuthenticated() && authStore.user?.id === (documentData.ownerId?._id || documentData.ownerId)"
            type="text" 
            class="doc-title-input" 
            v-model="documentData.title" 
            @change="handleRename"
            @blur="handleRename"
          />
          <span v-else v-text="documentData.title"></span>
        </div>
      </div>

      <div class="actions">
        <ActiveViewers :active-users="activeUsers" />

        <ShareDropdown 
          v-if="documentData"
          :document-id="documentId"
          :shared-with="documentData.sharedWith || []"
          :is-owner="authStore.user?.id === (documentData.ownerId?._id || documentData.ownerId)"
          :owner-data="documentData || null"
          :my-user-id="authStore.user?.id as string"
          @refresh="fetchDocumentData"
        />

        <UserMenu />
      </div>
    </header>

    <div v-if="isLoading" class="loading">Caricamento editor in corso...</div>

    <div v-else-if="documentData" class="document-workspace">
      <div class="editor-area">
        <Editor 
          ref="editorRef" 
          :documentId="documentId" 
          :ownerId="documentData.ownerId?._id || documentData.ownerId" 
          :sharedWith="documentData.sharedWith" 
        />
      </div>

      <aside class="comments-sidebar">
        <div class="sidebar-header">
          <h3>Commenti</h3>
          <span class="comments-count" v-if="documentData.comments?.length">
            {{ documentData.comments.length }}
          </span>
        </div>

        <div class="comments-list-wrapper">
          <div v-if="!documentData.comments || documentData.comments.length === 0" class="no-comments">
            <span class="no-comments-icon">💬</span>
            <p>Nessun commento per questo documento</p>
            <small v-if="currentUserRole !== 'viewer'">Inizia la conversazione scrivendo qui sotto.</small>
          </div>

          <div v-else class="comments-list-container">
            <TransitionGroup name="comment-list" tag="div" class="comments-list">
              <div 
                v-for="comment in documentData.comments" 
                :key="comment._id" 
                class="comment-card"
                :class="{ 'my-comment': (comment.userId?._id || comment.userId) === authStore.user?.id }"
              >
                <div class="comment-header">
                  <div class="comment-author-avatar">
                    {{ comment.userId?.firstName?.[0]?.toUpperCase() || '?' }}
                  </div>
                  <div class="comment-meta">
                    <span class="comment-author-name">
                      {{ comment.userId?.firstName }} {{ comment.userId?.lastName }}
                    </span>
                    <span class="comment-date">
                      {{ formatDate(comment.createdAt) }}
                    </span>
                  </div>

                  <button 
                    v-if="canDeleteComment(comment)"
                    class="delete-comment-btn"
                    @click="handleDeleteComment(comment._id)"
                    title="Elimina commento"
                  >
                    ✕
                  </button>
                </div>

                <div class="comment-body">
                  <p>{{ comment.content }}</p>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <div class="comment-input-area" v-if="currentUserRole !== 'viewer'">
          <textarea 
            v-model="newCommentText" 
            placeholder="Aggiungi un commento..." 
            rows="2"
            :disabled="isSubmittingComment"
            @keydown.enter.prevent="handleSendComment"
          ></textarea>
          <div class="input-actions">
            <button 
              class="send-comment-btn" 
              :disabled="!newCommentText.trim() || isSubmittingComment" 
              @click="handleSendComment"
            >
              {{ isSubmittingComment ? 'Invio...' : 'Commenta' }}
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #f8f9fa;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
}

.doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: #f1f3f4;
  height: 64px;
  flex-shrink: 0;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dok-icon {
  font-size: 36px;
  color: #1a73e8;
}

.doc-title-container {
  display: flex;
  align-items: center;
}

.doc-title-input {
  font-size: 18px;
  font-weight: 400;
  color: #1f1f1f;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 2px 8px;
  background: transparent;
  outline: none;
  font-family: inherit;
  width: 300px;
}

.doc-title-input:hover {
  border-color: #dadce0;
}

.doc-title-input:focus {
  border-color: #1a73e8;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn {
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  color: #5f6368;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.icon-btn:hover {
  background-color: rgba(0,0,0,0.05);
}

.document-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.editor-area {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.comments-sidebar {
  width: 320px;
  border-left: 1px solid #dadce0;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.02);
  z-index: 10;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #202124;
}

.comments-count {
  background-color: #e8f0fe;
  color: #1a73e8;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.comments-list-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f8f9fa;
  position: relative;
}

.comments-list-container {
  min-height: 100%;
}

.no-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #5f6368;
  padding: 0 16px;
}

.no-comments-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.no-comments p {
  margin: 0 0 4px 0;
  font-weight: 500;
  font-size: 13px;
}

.no-comments small {
  font-size: 11px;
  color: #70757a;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card {
  background: #ffffff;
  border: 1px solid #dadce0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  position: relative;
  text-align: left;
}

.comment-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border-color: #c2c4c7;
}

.comment-card.my-comment {
  border-left: 3px solid #1a73e8;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  position: relative;
}

.comment-author-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: #1a73e8;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
  margin-right: 8px;
  flex-shrink: 0;
}

.comment-card.my-comment .comment-author-avatar {
  background-color: #34a853;
}

.comment-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.comment-author-name {
  font-size: 12px;
  font-weight: 600;
  color: #202124;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comment-date {
  font-size: 10px;
  color: #70757a;
}

.delete-comment-btn {
  background: transparent;
  border: none;
  color: #dadce0;
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  margin-left: 4px;
}

.comment-card:hover .delete-comment-btn {
  color: #5f6368;
}

.delete-comment-btn:hover {
  background-color: #f1f3f4;
  color: #d93025 !important;
}

.comment-body {
  font-size: 13px;
  color: #3c4043;
  line-height: 1.4;
  word-break: break-word;
}

.comment-body p {
  margin: 0;
  white-space: pre-wrap;
}

.comment-input-area {
  padding: 12px 16px 16px 16px;
  border-top: 1px solid #f1f3f4;
  background-color: #ffffff;
}

.comment-input-area textarea {
  width: 100%;
  border: 1px solid #dadce0;
  border-radius: 8px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13px;
  outline: none;
  resize: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.comment-input-area textarea:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15);
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.send-comment-btn {
  background-color: #1a73e8;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-comment-btn:hover:not(:disabled) {
  background-color: #1557b0;
}

.send-comment-btn:disabled {
  background-color: #dadce0;
  color: #80868b;
  cursor: not-allowed;
}

.comment-list-enter-active,
.comment-list-leave-active {
  transition: all 0.25s ease;
}

.comment-list-enter-from,
.comment-list-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.loading {
  text-align: center;
  margin-top: 3rem;
  color: #5f6368;
  font-size: 16px;
}

@media screen and (max-width: 992px) {
  .comments-sidebar {
    width: 280px;
  }
}

@media screen and (max-width: 768px) {
  .document-workspace {
    flex-direction: column;
  }
  
  .comments-sidebar {
    width: 100%;
    height: 300px;
    border-left: none;
    border-top: 1px solid #dadce0;
  }
}
</style>