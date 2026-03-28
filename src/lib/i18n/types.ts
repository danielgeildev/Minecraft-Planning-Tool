export interface Translations {
  nav: {
    dashboard: string
    progress: string
    spielplan: string
    goals: string
    quests: string
    buildings: string
    items: string
    graph: string
    notes: string
    timeline: string
    settings: string
  }
  sidebar: {
    tagline: string
    subtitle: string
  }
  settings: {
    title: string
    subtitle: string
    tabs: {
      appearance: string
      backup: string
      achievements: string
      reset: string
    }
    appearance: {
      title: string
      playerName: string
      playerNameDesc: string
      playerNamePlaceholder: string
      darkMode: string
      darkModeDesc: string
      darkModeAriaEnable: string
      darkModeAriaDisable: string
      language: string
      languageDesc: string
      languageSearchPlaceholder: string
    }
    backup: {
      title: string
      subtitle: string
      exportTitle: string
      exportDesc: string
      exportNoteHighlight: string
      exportNote: string
      exportButton: string
      importTitle: string
      importDesc: string
      importWarningHighlight: string
      importWarning: string
      importButton: string
      importSuccess: string
      invalidFile: string
      fileReadError: string
      fileError: string
    }
    achievements: {
      unlocked: string
      secret: string
      replayTitle: string
      secretTitle: string
    }
    reset: {
      title: string
      subtitle: string
      listTitle: string
      quests: string
      items: string
      buildings: string
      goals: string
      notes: string
      achievements: string
      images: string
      entries: string
      allIndexedDB: string
      warningHighlight: string
      warning: string
      button: string
      success: string
    }
    dialogs: {
      importTitle: string
      importDesc: string
      importConfirm: string
      resetTitle: string
      resetDesc: string
      resetConfirm: string
      cancel: string
    }
  }
  dashboard: {
    greeting: string
    subtitle: string
    overallProgress: string
    questsDone: string
    activeGoals: string
    all: string
    lastAchievements: string
    achievementsCount: string
    nextQuests: string
    itemsNeeded: string
    allQuestsDone: string
    allItemsCollected: string
    collecting: string
    needed: string
    replayEffect: string
    stats: {
      activeQuests: string
      activeQuestsSub: string
      buildings: string
      buildingsSub: string
      itemsNeeded: string
      itemsSub: string
    }
  }
  common: {
    cancel: string
    confirm: string
    areYouSure: string
    irreversible: string
    delete: string
  }
}
