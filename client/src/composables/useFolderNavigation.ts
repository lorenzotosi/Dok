import { ref, watch, onMounted, computed } from 'vue';
import type { Ref } from 'vue';

interface FolderStackItem {
  id: string | null;
  name: string;
}

export function useFolderNavigation(
  currentSection: Ref<'private' | 'public' | 'shared'>,
  authStore: any,
  refreshData: () => void,
  folderStore: any
) {
  const currentFolderId = ref<string | null>(null);
  const folderStack = ref<FolderStackItem[]>([
    { id: null, name: 'Il Mio Dok' }
  ]);

  watch([currentSection, folderStack], ([newSection, newStack]) => {
    sessionStorage.setItem('dok_last_section', newSection);
    sessionStorage.setItem('dok_last_stack', JSON.stringify(newStack));
    sessionStorage.setItem('dok_last_folder_id', currentFolderId.value || '');
  }, { deep: true });

  onMounted(() => {
    const savedSection = sessionStorage.getItem('dok_last_section') as 'private' | 'public';
    const savedStack = sessionStorage.getItem('dok_last_stack');
    const savedFolderId = sessionStorage.getItem('dok_last_folder_id');

    if (savedSection) {
      currentSection.value = savedSection;
    } else if (!authStore.token) {
      currentSection.value = 'public';
    }

    if (savedStack) {
      try {
        folderStack.value = JSON.parse(savedStack);
        currentFolderId.value = savedFolderId || null;
      } catch (e) {
        console.error("Errore nel ripristino del percorso salvato", e);
      }
    }

    refreshData();
  });

  const handleSectionChange = (section: 'private' | 'public' | 'shared') => {
    currentSection.value = section;
    currentFolderId.value = null;
    
    let name = 'Il Mio Dok';
    if (section === 'public') name = 'Dok globali';
    else if (section === 'shared') name = 'Condivisi con me';

    folderStack.value = [{ id: null, name }]; 
    refreshData();
  };

  const handleEnterFolder = (id: string) => {
    const folder = folderStore.folders.find((f: any) => f._id === id);
    const name = folder ? folder.name : 'Cartella';
    
    currentFolderId.value = id;
    folderStack.value.push({ id, name });
    refreshData();
  };

  const handleBack = () => {
    if (folderStack.value.length > 1) {
      folderStack.value.pop(); 
      const previous = folderStack.value[folderStack.value.length - 1];
      currentFolderId.value = previous.id;
      refreshData();
    }
  };

  const currentTitle = computed(() => {
    return folderStack.value[folderStack.value.length - 1].name;
  });

  return {
    currentFolderId,
    folderStack,
    handleSectionChange,
    handleEnterFolder,
    handleBack,
    currentTitle
  };
}
