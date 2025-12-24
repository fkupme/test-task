import { ref } from 'vue'

export interface TabItem {
  key: string
  label: string
}

export function useTabs<T extends string>(tabs: TabItem[], defaultTab?: T) {
  const activeTab = ref<T>((defaultTab || tabs[0]?.key) as T)

  function setActiveTab(tab: T) {
    activeTab.value = tab
  }

  function getTabByKey(key: string) {
    return tabs.find(tab => tab.key === key)
  }

  return {
    activeTab,
    setActiveTab,
    getTabByKey,
    tabs
  }
}