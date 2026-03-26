import type { QuestNode, ItemNode, Building, Goal } from '@/types'
import type { NoteNode } from '@/types/note'

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface AchievementCheckInput {
  quests:      QuestNode[]
  items:       ItemNode[]
  buildings:   Building[]
  notes:       NoteNode[]
  goals:       Goal[]
  unlockedIds: string[]
  totalXp?:    number
  level?:      number
}

export interface Achievement {
  id:           string
  emoji:        string
  title:        string
  description:  string
  rarity:       AchievementRarity
  secret?:      boolean
  check:        (input: AchievementCheckInput) => boolean
  progressText?: (input: AchievementCheckInput) => string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const doneQuests    = (q: QuestNode[]) => q.filter(x => x.status === 'done').length
const haveItems     = (i: ItemNode[])  => i.filter(x => x.status === 'have').length
const doneBuildings = (b: Building[])  => b.filter(x => x.status === 'done').length
const uniqueTags    = (n: NoteNode[])  => new Set(n.flatMap(x => x.tags)).size
const totalLinks    = (n: NoteNode[])  => n.reduce((s, x) => s + x.linkedNodeIds.length, 0)

export const ACHIEVEMENTS: Achievement[] = [

  // ─── Common ─────────────────────────────────────────────────────────────────

  {
    id: 'first-quest',
    emoji: '🌱',
    title: 'Erste Schritte',
    description: 'Erste Quest abgeschlossen.',
    rarity: 'common',
    check: ({ quests }) => doneQuests(quests) >= 1,
  },
  {
    id: 'first-item',
    emoji: '📦',
    title: 'Packrat',
    description: 'Erstes Item gesammelt.',
    rarity: 'common',
    check: ({ items }) => haveItems(items) >= 1,
  },
  {
    id: 'first-building',
    emoji: '🏠',
    title: 'Heimwerkerin',
    description: 'Erstes Gebäude fertiggestellt.',
    rarity: 'common',
    check: ({ buildings }) => doneBuildings(buildings) >= 1,
  },
  {
    id: 'first-note',
    emoji: '📝',
    title: 'Notizbuch',
    description: 'Erste Notiz erstellt.',
    rarity: 'common',
    check: ({ notes }) => notes.length >= 1,
  },
  {
    id: 'first-goal',
    emoji: '🎯',
    title: 'Zielstrebig',
    description: 'Erstes Ziel gesetzt.',
    rarity: 'common',
    check: ({ goals }) => goals.length >= 1,
  },
  {
    id: 'first-tag',
    emoji: '🏷️',
    title: 'Ordnungsliebe',
    description: 'Erste Notiz mit einem Tag versehen.',
    rarity: 'common',
    check: ({ notes }) => notes.some(n => n.tags.length > 0),
  },
  {
    id: 'first-photo',
    emoji: '📷',
    title: 'Schnappschuss',
    description: 'Erstes Bild in einer Notiz gespeichert.',
    rarity: 'common',
    check: ({ notes }) => notes.some(n => n.images.length > 0),
  },
  {
    id: 'first-link',
    emoji: '🔗',
    title: 'Vernetzt',
    description: 'Erste Notiz mit einem verknüpften Eintrag.',
    rarity: 'common',
    check: ({ notes }) => notes.some(n => n.linkedNodeIds.length > 0),
  },
  {
    id: 'quests-5',
    emoji: '⚡',
    title: 'Durchstarterin',
    description: '5 Quests abgeschlossen.',
    rarity: 'common',
    check: ({ quests }) => doneQuests(quests) >= 5,
    progressText: ({ quests }) => `${doneQuests(quests)}/5 Quests`,
  },
  {
    id: 'items-5',
    emoji: '🎒',
    title: 'Taschenträgerin',
    description: '5 Items gesammelt.',
    rarity: 'common',
    check: ({ items }) => haveItems(items) >= 5,
    progressText: ({ items }) => `${haveItems(items)}/5 Items`,
  },

  // ─── Rare ───────────────────────────────────────────────────────────────────

  {
    id: 'quests-10',
    emoji: '⚔️',
    title: 'Abenteurerin',
    description: '10 Quests erledigt.',
    rarity: 'rare',
    check: ({ quests }) => doneQuests(quests) >= 10,
    progressText: ({ quests }) => `${doneQuests(quests)}/10 Quests`,
  },
  {
    id: 'items-10',
    emoji: '💎',
    title: 'Sammlerin',
    description: '10 Items gesammelt.',
    rarity: 'rare',
    check: ({ items }) => haveItems(items) >= 10,
    progressText: ({ items }) => `${haveItems(items)}/10 Items`,
  },
  {
    id: 'buildings-3',
    emoji: '🏗️',
    title: 'Baumeisterin',
    description: '3 Gebäude fertiggestellt.',
    rarity: 'rare',
    check: ({ buildings }) => doneBuildings(buildings) >= 3,
    progressText: ({ buildings }) => `${doneBuildings(buildings)}/3 Gebäude`,
  },
  {
    id: 'notes-10',
    emoji: '📚',
    title: 'Chronistin',
    description: '10 Notizen erstellt.',
    rarity: 'rare',
    check: ({ notes }) => notes.length >= 10,
    progressText: ({ notes }) => `${notes.length}/10 Notizen`,
  },
  {
    id: 'versatile',
    emoji: '🌟',
    title: 'Vielseitig',
    description: 'In jedem Bereich mindestens 1 Ding erledigt.',
    rarity: 'rare',
    check: ({ quests, items, buildings, notes }) =>
      doneQuests(quests) >= 1 && haveItems(items) >= 1 &&
      doneBuildings(buildings) >= 1 && notes.length >= 1,
    progressText: ({ quests, items, buildings, notes }) => {
      const done = [doneQuests(quests) >= 1, haveItems(items) >= 1, doneBuildings(buildings) >= 1, notes.length >= 1].filter(Boolean).length
      return `${done}/4 Bereiche`
    },
  },
  {
    id: 'goals-3',
    emoji: '🗺️',
    title: 'Planerin',
    description: '3 Ziele gesetzt.',
    rarity: 'rare',
    check: ({ goals }) => goals.length >= 3,
    progressText: ({ goals }) => `${goals.length}/3 Ziele`,
  },
  {
    id: 'high-prio-3',
    emoji: '🔥',
    title: 'Feuerwehr',
    description: '3 Quests mit hoher Priorität erledigt.',
    rarity: 'rare',
    check: ({ quests }) => quests.filter(q => q.status === 'done' && q.priority === 'high').length >= 3,
    progressText: ({ quests }) => {
      const n = quests.filter(q => q.status === 'done' && q.priority === 'high').length
      return `${n}/3 hohe Priorität`
    },
  },
  {
    id: 'notes-tagged-3',
    emoji: '🗂️',
    title: 'Archivarin',
    description: '3 Notizen mit Tags versehen.',
    rarity: 'rare',
    check: ({ notes }) => notes.filter(n => n.tags.length > 0).length >= 3,
    progressText: ({ notes }) => `${notes.filter(n => n.tags.length > 0).length}/3 getaggte Notizen`,
  },
  {
    id: 'notes-with-image-2',
    emoji: '📸',
    title: 'Fotografin',
    description: '2 Notizen mit Bildern.',
    rarity: 'rare',
    check: ({ notes }) => notes.filter(n => n.images.length > 0).length >= 2,
    progressText: ({ notes }) => `${notes.filter(n => n.images.length > 0).length}/2 Notizen mit Bildern`,
  },
  {
    id: 'notes-linked-2',
    emoji: '🕸️',
    title: 'Netzwerkerin',
    description: '2 Notizen mit verknüpften Einträgen.',
    rarity: 'rare',
    check: ({ notes }) => notes.filter(n => n.linkedNodeIds.length > 0).length >= 2,
    progressText: ({ notes }) => `${notes.filter(n => n.linkedNodeIds.length > 0).length}/2 verknüpfte Notizen`,
  },
  {
    id: 'items-needed-10',
    emoji: '📋',
    title: 'Einkaufsliste',
    description: '10 Items auf der Wunschliste.',
    rarity: 'rare',
    check: ({ items }) => items.filter(i => i.status === 'needed').length >= 10,
    progressText: ({ items }) => `${items.filter(i => i.status === 'needed').length}/10 Items benötigt`,
  },
  {
    id: 'buildings-started-3',
    emoji: '🔨',
    title: 'Fleißige Hände',
    description: '3 Gebäude in Arbeit oder fertig.',
    rarity: 'rare',
    check: ({ buildings }) => buildings.filter(b => b.status === 'in-progress' || b.status === 'done').length >= 3,
    progressText: ({ buildings }) => `${buildings.filter(b => b.status === 'in-progress' || b.status === 'done').length}/3 Gebäude`,
  },

  // ─── Epic ────────────────────────────────────────────────────────────────────

  {
    id: 'quests-25',
    emoji: '🦸',
    title: 'Questheld',
    description: '25 Quests erledigt.',
    rarity: 'epic',
    check: ({ quests }) => doneQuests(quests) >= 25,
    progressText: ({ quests }) => `${doneQuests(quests)}/25 Quests`,
  },
  {
    id: 'items-25',
    emoji: '🪙',
    title: 'Schatzmeisterin',
    description: '25 Items gesammelt.',
    rarity: 'epic',
    check: ({ items }) => haveItems(items) >= 25,
    progressText: ({ items }) => `${haveItems(items)}/25 Items`,
  },
  {
    id: 'buildings-5',
    emoji: '🏛️',
    title: 'Architektin',
    description: '5 Gebäude fertiggestellt.',
    rarity: 'epic',
    check: ({ buildings }) => doneBuildings(buildings) >= 5,
    progressText: ({ buildings }) => `${doneBuildings(buildings)}/5 Gebäude`,
  },
  {
    id: 'master',
    emoji: '⭐',
    title: 'Meisterin',
    description: '15 Quests + 15 Items + 3 Gebäude + 5 Notizen.',
    rarity: 'epic',
    check: ({ quests, items, buildings, notes }) =>
      doneQuests(quests) >= 15 && haveItems(items) >= 15 &&
      doneBuildings(buildings) >= 3 && notes.length >= 5,
    progressText: ({ quests, items, buildings, notes }) => {
      const done = [doneQuests(quests) >= 15, haveItems(items) >= 15, doneBuildings(buildings) >= 3, notes.length >= 5].filter(Boolean).length
      return `${done}/4 Bedingungen`
    },
  },
  {
    id: 'notes-25',
    emoji: '📖',
    title: 'Autorin',
    description: '25 Notizen erstellt.',
    rarity: 'epic',
    check: ({ notes }) => notes.length >= 25,
    progressText: ({ notes }) => `${notes.length}/25 Notizen`,
  },
  {
    id: 'goals-5',
    emoji: '🏹',
    title: 'Visionärin',
    description: '5 Ziele gesetzt.',
    rarity: 'epic',
    check: ({ goals }) => goals.length >= 5,
    progressText: ({ goals }) => `${goals.length}/5 Ziele`,
  },
  {
    id: 'buildings-8',
    emoji: '🏙️',
    title: 'Stadtplanerin',
    description: '8 Gebäude fertiggestellt.',
    rarity: 'epic',
    check: ({ buildings }) => doneBuildings(buildings) >= 8,
    progressText: ({ buildings }) => `${doneBuildings(buildings)}/8 Gebäude`,
  },
  {
    id: 'high-prio-10',
    emoji: '💥',
    title: 'Krisenmanagerin',
    description: '10 Quests mit hoher Priorität erledigt.',
    rarity: 'epic',
    check: ({ quests }) => quests.filter(q => q.status === 'done' && q.priority === 'high').length >= 10,
    progressText: ({ quests }) => `${quests.filter(q => q.status === 'done' && q.priority === 'high').length}/10 hohe Priorität`,
  },
  {
    id: 'notes-images-5',
    emoji: '🎨',
    title: 'Künstlerin',
    description: '5 Notizen mit Bildern.',
    rarity: 'epic',
    check: ({ notes }) => notes.filter(n => n.images.length > 0).length >= 5,
    progressText: ({ notes }) => `${notes.filter(n => n.images.length > 0).length}/5 Notizen mit Bildern`,
  },
  {
    id: 'notes-hub',
    emoji: '🔗',
    title: 'Knotenpunkt',
    description: 'Eine Notiz mit 3 oder mehr verknüpften Einträgen.',
    rarity: 'epic',
    check: ({ notes }) => notes.some(n => n.linkedNodeIds.length >= 3),
  },
  {
    id: 'multitasker',
    emoji: '⏳',
    title: 'Multitaskerin',
    description: '5 Quests gleichzeitig in Arbeit.',
    rarity: 'epic',
    check: ({ quests }) => quests.filter(q => q.status === 'in-progress').length >= 5,
    progressText: ({ quests }) => `${quests.filter(q => q.status === 'in-progress').length}/5 aktive Quests`,
  },
  {
    id: 'all-priorities',
    emoji: '🎖️',
    title: 'Allrounderin',
    description: 'Quests aus allen 3 Prioritätsstufen abgeschlossen.',
    rarity: 'epic',
    check: ({ quests }) => {
      const done = quests.filter(q => q.status === 'done')
      return done.some(q => q.priority === 'high') &&
             done.some(q => q.priority === 'medium') &&
             done.some(q => q.priority === 'low')
    },
    progressText: ({ quests }) => {
      const done = quests.filter(q => q.status === 'done')
      const n = [
        done.some(q => q.priority === 'high'),
        done.some(q => q.priority === 'medium'),
        done.some(q => q.priority === 'low'),
      ].filter(Boolean).length
      return `${n}/3 Prioritätsstufen`
    },
  },
  {
    id: 'tags-variety',
    emoji: '🌈',
    title: 'Kreativkopf',
    description: '5 verschiedene Tags über alle Notizen hinweg.',
    rarity: 'epic',
    check: ({ notes }) => uniqueTags(notes) >= 5,
    progressText: ({ notes }) => `${uniqueTags(notes)}/5 verschiedene Tags`,
  },
  {
    id: 'total-links-10',
    emoji: '🕸️',
    title: 'Spinnerin',
    description: '10 Verknüpfungen gesamt über alle Notizen.',
    rarity: 'epic',
    check: ({ notes }) => totalLinks(notes) >= 10,
    progressText: ({ notes }) => `${totalLinks(notes)}/10 Verknüpfungen`,
  },
  {
    id: 'items-50',
    emoji: '💰',
    title: 'Reichtum',
    description: '50 Items gesammelt.',
    rarity: 'epic',
    check: ({ items }) => haveItems(items) >= 50,
    progressText: ({ items }) => `${haveItems(items)}/50 Items`,
  },
  {
    id: 'grand-planner',
    emoji: '🗓️',
    title: 'Großplanerin',
    description: '5 Ziele + 25 erledigte Quests.',
    rarity: 'epic',
    check: ({ quests, goals }) => goals.length >= 5 && doneQuests(quests) >= 25,
    progressText: ({ quests, goals }) => {
      const done = [goals.length >= 5, doneQuests(quests) >= 25].filter(Boolean).length
      return `${done}/2 Bedingungen`
    },
  },
  {
    id: 'note-content-rich',
    emoji: '📜',
    title: 'Romanautorin',
    description: 'Eine ausführliche Notiz mit viel Inhalt verfasst.',
    rarity: 'epic',
    check: ({ notes }) => notes.some(n => (n.content ?? '').length > 300),
  },
  {
    id: 'buildings-goals-combo',
    emoji: '🏆',
    title: 'Vollenderin',
    description: '5 Gebäude fertig + 3 Ziele gesetzt.',
    rarity: 'epic',
    check: ({ buildings, goals }) => doneBuildings(buildings) >= 5 && goals.length >= 3,
    progressText: ({ buildings, goals }) => {
      const done = [doneBuildings(buildings) >= 5, goals.length >= 3].filter(Boolean).length
      return `${done}/2 Bedingungen`
    },
  },

  // ─── Legendary ───────────────────────────────────────────────────────────────

  {
    id: 'quests-50',
    emoji: '👑',
    title: 'Legende',
    description: '50 Quests erledigt.',
    rarity: 'legendary',
    check: ({ quests }) => doneQuests(quests) >= 50,
    progressText: ({ quests }) => `${doneQuests(quests)}/50 Quests`,
  },
  {
    id: 'quests-100',
    emoji: '🌌',
    title: 'Unsterblich',
    description: '100 Quests erledigt.',
    rarity: 'legendary',
    check: ({ quests }) => doneQuests(quests) >= 100,
    progressText: ({ quests }) => `${doneQuests(quests)}/100 Quests`,
  },
  {
    id: 'items-100',
    emoji: '💫',
    title: 'Schatzgewölbe',
    description: '100 Items gesammelt.',
    rarity: 'legendary',
    check: ({ items }) => haveItems(items) >= 100,
    progressText: ({ items }) => `${haveItems(items)}/100 Items`,
  },
  {
    id: 'buildings-15',
    emoji: '🌆',
    title: 'Metropole',
    description: '15 Gebäude fertiggestellt.',
    rarity: 'legendary',
    check: ({ buildings }) => doneBuildings(buildings) >= 15,
    progressText: ({ buildings }) => `${doneBuildings(buildings)}/15 Gebäude`,
  },
  {
    id: 'notes-50',
    emoji: '📕',
    title: 'Bibliothekarin',
    description: '50 Notizen erstellt.',
    rarity: 'legendary',
    check: ({ notes }) => notes.length >= 50,
    progressText: ({ notes }) => `${notes.length}/50 Notizen`,
  },
  {
    id: 'goals-10',
    emoji: '🌠',
    title: 'Träumerin',
    description: '10 Ziele gesetzt.',
    rarity: 'legendary',
    check: ({ goals }) => goals.length >= 10,
    progressText: ({ goals }) => `${goals.length}/10 Ziele`,
  },
  {
    id: 'ultimate',
    emoji: '🔱',
    title: 'Ultimativ',
    description: '50 Quests + 50 Items + 10 Gebäude + 20 Notizen + 5 Ziele.',
    rarity: 'legendary',
    check: ({ quests, items, buildings, notes, goals }) =>
      doneQuests(quests) >= 50 && haveItems(items) >= 50 &&
      doneBuildings(buildings) >= 10 && notes.length >= 20 && goals.length >= 5,
    progressText: ({ quests, items, buildings, notes, goals }) => {
      const done = [
        doneQuests(quests) >= 50, haveItems(items) >= 50,
        doneBuildings(buildings) >= 10, notes.length >= 20, goals.length >= 5,
      ].filter(Boolean).length
      return `${done}/5 Bedingungen`
    },
  },
  {
    id: 'note-library',
    emoji: '🗃️',
    title: 'Archiv',
    description: '20 Notizen mit Tags versehen.',
    rarity: 'legendary',
    check: ({ notes }) => notes.filter(n => n.tags.length > 0).length >= 20,
    progressText: ({ notes }) => `${notes.filter(n => n.tags.length > 0).length}/20 getaggte Notizen`,
  },
  {
    id: 'true-legend',
    emoji: '💎',
    title: 'Wahre Legende',
    description: '100 Quests + 100 Items + 10 Gebäude + 50 Notizen.',
    rarity: 'legendary',
    check: ({ quests, items, buildings, notes }) =>
      doneQuests(quests) >= 100 && haveItems(items) >= 100 &&
      doneBuildings(buildings) >= 10 && notes.length >= 50,
    progressText: ({ quests, items, buildings, notes }) => {
      const done = [
        doneQuests(quests) >= 100, haveItems(items) >= 100,
        doneBuildings(buildings) >= 10, notes.length >= 50,
      ].filter(Boolean).length
      return `${done}/4 Bedingungen`
    },
  },
  {
    id: 'all-the-mods',
    emoji: '🎮',
    title: 'All the Mods!',
    description: 'Alle normalen Achievements freigeschaltet.',
    rarity: 'legendary',
    check: ({ unlockedIds }) => {
      const targets = ACHIEVEMENTS.filter(a => a.rarity !== 'mythic' && a.id !== 'all-the-mods')
      return targets.every(a => unlockedIds.includes(a.id))
    },
    progressText: ({ unlockedIds }) => {
      const targets = ACHIEVEMENTS.filter(a => a.rarity !== 'mythic' && a.id !== 'all-the-mods')
      const done = targets.filter(a => unlockedIds.includes(a.id)).length
      return `${done}/${targets.length} Achievements`
    },
  },

  // ─── Mob-Level Tier Achievements ──────────────────────────────────────────────

  // Nature Tier (Levels 1–5)
  {
    id: 'tier-nature-start',
    emoji: '🐔',
    title: 'Existenzbestätigung',
    description: 'Level 2 erreicht. Du bist offiziell mehr als ein Huhn.',
    rarity: 'common',
    check: ({ level }) => (level ?? 0) >= 2,
    progressText: ({ level }) => `Level ${level ?? 1}/2`,
  },
  {
    id: 'tier-nature-complete',
    emoji: '🐰',
    title: 'Natürliche Selektion überlebt',
    description: 'Level 5 erreicht. Darwin wäre enttäuscht, aber hey.',
    rarity: 'common',
    check: ({ level }) => (level ?? 0) >= 5,
    progressText: ({ level }) => `Level ${level ?? 1}/5`,
  },

  // Undead Tier (Levels 6–10)
  {
    id: 'tier-undead-start',
    emoji: '🧟',
    title: 'Untot und trotzdem busy',
    description: 'Level 6 erreicht. Dein Gehirn ist optional, dein Grind nicht.',
    rarity: 'rare',
    check: ({ level }) => (level ?? 0) >= 6,
    progressText: ({ level }) => `Level ${level ?? 1}/6`,
  },
  {
    id: 'tier-undead-mid',
    emoji: '🕷️',
    title: 'Klebt überall',
    description: 'Level 8 erreicht. Du hast dich festgebissen wie eine Spinne an der Decke.',
    rarity: 'rare',
    check: ({ level }) => (level ?? 0) >= 8,
    progressText: ({ level }) => `Level ${level ?? 1}/8`,
  },
  {
    id: 'tier-undead-complete',
    emoji: '🧊',
    title: 'Lost mit Selbstvertrauen',
    description: 'Level 10 erreicht. Du weißt nicht wo du bist, aber du bist überzeugt.',
    rarity: 'rare',
    check: ({ level }) => (level ?? 0) >= 10,
    progressText: ({ level }) => `Level ${level ?? 1}/10`,
  },

  // Fantasy Tier (Levels 11–15)
  {
    id: 'tier-fantasy-start',
    emoji: '💥',
    title: 'Tick, Tick, Boom',
    description: 'Level 11 erreicht. Ab jetzt bist du eine Gefahr für alle — inklusive dir selbst.',
    rarity: 'epic',
    check: ({ level }) => (level ?? 0) >= 11,
    progressText: ({ level }) => `Level ${level ?? 1}/11`,
  },
  {
    id: 'tier-fantasy-mid',
    emoji: '🔥',
    title: 'Dauerhaft am Brennen',
    description: 'Level 13 erreicht. Burnout oder Fortschritt? Ja.',
    rarity: 'epic',
    check: ({ level }) => (level ?? 0) >= 13,
    progressText: ({ level }) => `Level ${level ?? 1}/13`,
  },
  {
    id: 'tier-fantasy-complete',
    emoji: '🧙‍♀️',
    title: 'Experimentierfreudig',
    description: 'Level 15 erreicht. Deine Methoden sind fragwürdig, aber die Ergebnisse… naja.',
    rarity: 'epic',
    check: ({ level }) => (level ?? 0) >= 15,
    progressText: ({ level }) => `Level ${level ?? 1}/15`,
  },

  // Boss Tier (Levels 16–20)
  {
    id: 'tier-boss-start',
    emoji: '🐗',
    title: 'Hirn abgegeben',
    description: 'Level 16 erreicht. Strategie? Nein. Einfach drauf. Funktioniert irgendwie.',
    rarity: 'legendary',
    check: ({ level }) => (level ?? 0) >= 16,
    progressText: ({ level }) => `Level ${level ?? 1}/16`,
  },
  {
    id: 'tier-boss-mid',
    emoji: '🐉',
    title: 'Chaos mit Ego',
    description: 'Level 17 erreicht. Der Ender Dragon ist beeindruckt. Von sich selbst, aber trotzdem.',
    rarity: 'legendary',
    check: ({ level }) => (level ?? 0) >= 17,
    progressText: ({ level }) => `Level ${level ?? 1}/17`,
  },
  {
    id: 'tier-boss-complete',
    emoji: '👹',
    title: 'Blinder Boss',
    description: 'Level 20 erreicht. Du siehst nichts, verstehst nichts — und bist trotzdem hier.',
    rarity: 'legendary',
    check: ({ level }) => (level ?? 0) >= 20,
    progressText: ({ level }) => `Level ${level ?? 1}/20`,
  },

  // Transcend Tier (Level 21)
  {
    id: 'tier-transcend',
    emoji: '🐣',
    title: 'Der Kreis schließt sich',
    description: 'Level 21. Alles gemeistert, alles erreicht… und du bist ein Baby-Huhn. Perfekt.',
    rarity: 'mythic',
    secret: true,
    check: ({ level }) => (level ?? 0) >= 21,
    progressText: ({ level }) => `Level ${level ?? 1}/21`,
  },

  // XP Milestone Achievements
  {
    id: 'xp-100',
    emoji: '⚡',
    title: 'Erste Funken',
    description: '100 XP gesammelt. Die Reise hat begonnen!',
    rarity: 'common',
    check: ({ totalXp }) => (totalXp ?? 0) >= 100,
    progressText: ({ totalXp }) => `${totalXp ?? 0}/100 XP`,
  },
  {
    id: 'xp-500',
    emoji: '✨',
    title: 'Sternschnuppe',
    description: '500 XP gesammelt. Du leuchtest… ein bisschen.',
    rarity: 'rare',
    check: ({ totalXp }) => (totalXp ?? 0) >= 500,
    progressText: ({ totalXp }) => `${totalXp ?? 0}/500 XP`,
  },
  {
    id: 'xp-1000',
    emoji: '🌟',
    title: 'Tausenderin',
    description: '1000 XP. Vier Stellen! Das ist… mehr als erwartet.',
    rarity: 'rare',
    check: ({ totalXp }) => (totalXp ?? 0) >= 1000,
    progressText: ({ totalXp }) => `${totalXp ?? 0}/1.000 XP`,
  },
  {
    id: 'xp-3000',
    emoji: '💫',
    title: 'XP-Maschine',
    description: '3000 XP. Du sammelst XP wie andere Leute Staub.',
    rarity: 'epic',
    check: ({ totalXp }) => (totalXp ?? 0) >= 3000,
    progressText: ({ totalXp }) => `${totalXp ?? 0}/3.000 XP`,
  },
  {
    id: 'xp-7000',
    emoji: '🔮',
    title: 'XP-Schwarzes Loch',
    description: '7000 XP. Du ziehst XP an wie ein Magnet. Ein sehr fleißiger Magnet.',
    rarity: 'legendary',
    check: ({ totalXp }) => (totalXp ?? 0) >= 7000,
    progressText: ({ totalXp }) => `${totalXp ?? 0}/7.000 XP`,
  },
  {
    id: 'xp-11300',
    emoji: '🌈',
    title: 'XP-Göttin',
    description: '11.300 XP. Maximale XP-Stufe. Du bist buchstäblich am Ende. Im guten Sinne.',
    rarity: 'mythic',
    secret: true,
    check: ({ totalXp }) => (totalXp ?? 0) >= 11300,
    progressText: ({ totalXp }) => `${totalXp ?? 0}/11.300 XP`,
  },

  // ─── Mythic (Secret) ─────────────────────────────────────────────────────────

  {
    id: 'felix-lover',
    emoji: '/filbert-animal.gif',
    title: 'Felix Lover',
    description: 'Du hast Felix angeklickt. Er liebt dich auch! 🌸',
    rarity: 'mythic',
    secret: true,
    check: ({ unlockedIds }) => unlockedIds.includes('felix-lover'),
  },
  {
    id: 'world-architect',
    emoji: '🌍',
    title: 'Weltarchitektin',
    description: '20 Gebäude fertiggestellt. Eine ganze Stadt!',
    rarity: 'mythic',
    secret: true,
    check: ({ buildings }) => doneBuildings(buildings) >= 20,
    progressText: ({ buildings }) => `${doneBuildings(buildings)}/20 Gebäude`,
  },
  {
    id: 'tome-keeper',
    emoji: '📚',
    title: 'Meisterin der Schriften',
    description: '100 Notizen erstellt. Ein lebendiges Archiv.',
    rarity: 'mythic',
    secret: true,
    check: ({ notes }) => notes.length >= 100,
    progressText: ({ notes }) => `${notes.length}/100 Notizen`,
  },
  {
    id: 'web-weaver',
    emoji: '🕸️',
    title: 'Meisterin des Netzes',
    description: '50 Verknüpfungen über alle Notizen hinweg.',
    rarity: 'mythic',
    secret: true,
    check: ({ notes }) => totalLinks(notes) >= 50,
    progressText: ({ notes }) => `${totalLinks(notes)}/50 Verknüpfungen`,
  },
  {
    id: 'legendary-legend',
    emoji: '👑',
    title: 'Legendäre Legende',
    description: 'Alle Legendary Achievements freigeschaltet.',
    rarity: 'mythic',
    secret: true,
    check: ({ unlockedIds }) => {
      const legendaries = ACHIEVEMENTS.filter(a => a.rarity === 'legendary')
      return legendaries.every(a => unlockedIds.includes(a.id))
    },
    progressText: ({ unlockedIds }) => {
      const legendaries = ACHIEVEMENTS.filter(a => a.rarity === 'legendary')
      const done = legendaries.filter(a => unlockedIds.includes(a.id)).length
      return `${done}/${legendaries.length} Legendary`
    },
  },
  {
    id: 'grand-master',
    emoji: '⚔️',
    title: 'Großmeisterin',
    description: '100 Quests + 100 Items + 20 Gebäude. Das Ultimative.',
    rarity: 'mythic',
    secret: true,
    check: ({ quests, items, buildings }) =>
      doneQuests(quests) >= 100 && haveItems(items) >= 100 && doneBuildings(buildings) >= 20,
    progressText: ({ quests, items, buildings }) => {
      const done = [doneQuests(quests) >= 100, haveItems(items) >= 100, doneBuildings(buildings) >= 20].filter(Boolean).length
      return `${done}/3 Bedingungen`
    },
  },
  {
    id: 'collector-supreme',
    emoji: '💎',
    title: 'Schatzmeisterin Deluxe',
    description: '150 Items gesammelt. Unglaublicher Reichtum.',
    rarity: 'mythic',
    secret: true,
    check: ({ items }) => haveItems(items) >= 150,
    progressText: ({ items }) => `${haveItems(items)}/150 Items`,
  },
  {
    id: 'quest-destroyer',
    emoji: '⚡',
    title: 'Quest-Vernichterin',
    description: '200 Quests erledigt. Absolut unaufhaltsam.',
    rarity: 'mythic',
    secret: true,
    check: ({ quests }) => doneQuests(quests) >= 200,
    progressText: ({ quests }) => `${doneQuests(quests)}/200 Quests`,
  },
  {
    id: 'note-nexus',
    emoji: '🌐',
    title: 'Meisterin der Verbindungen',
    description: '10 Notizen mit Bildern UND Verknüpfungen.',
    rarity: 'mythic',
    secret: true,
    check: ({ notes }) => notes.filter(n => n.images.length > 0 && n.linkedNodeIds.length > 0).length >= 10,
    progressText: ({ notes }) => `${notes.filter(n => n.images.length > 0 && n.linkedNodeIds.length > 0).length}/10 Notizen`,
  },
  {
    id: 'the-end',
    emoji: '🌈',
    title: 'The End',
    description: 'Wirklich alle Achievements freigeschaltet. Du bist eine Göttin.',
    rarity: 'mythic',
    secret: true,
    check: ({ unlockedIds }) => {
      const others = ACHIEVEMENTS.filter(a => a.id !== 'the-end')
      return others.every(a => unlockedIds.includes(a.id))
    },
    progressText: ({ unlockedIds }) => {
      const others = ACHIEVEMENTS.filter(a => a.id !== 'the-end')
      const done = others.filter(a => unlockedIds.includes(a.id)).length
      return `${done}/${others.length} Achievements`
    },
  },
]

export const RARITY_ORDER: AchievementRarity[] = ['mythic', 'legendary', 'epic', 'rare', 'common']

export const RARITY_CONFIG: Record<AchievementRarity, {
  label:    string
  gradient: string
  badge:    string
  glow:     string
  ring:     string
  cardBg:   string
}> = {
  common: {
    label:    'Common',
    gradient: 'from-slate-500 to-slate-600',
    badge:    'bg-slate-400',
    glow:     '',
    ring:     '',
    cardBg:   'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600',
  },
  rare: {
    label:    'Rare',
    gradient: 'from-blue-500 to-blue-700',
    badge:    'bg-blue-400',
    glow:     'shadow-blue-400/40',
    ring:     '',
    cardBg:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  },
  epic: {
    label:    'Epic',
    gradient: 'from-purple-500 to-violet-700',
    badge:    'bg-purple-400',
    glow:     'shadow-purple-400/40',
    ring:     '',
    cardBg:   'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  },
  legendary: {
    label:    'Legendary',
    gradient: 'from-amber-400 via-yellow-400 to-amber-500',
    badge:    'bg-amber-400',
    glow:     'shadow-amber-400/50',
    ring:     'ring-2 ring-amber-300/60',
    cardBg:   'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
  },
  mythic: {
    label:    'Mythic',
    gradient: 'from-violet-500 via-fuchsia-400 via-pink-500 to-amber-400',
    badge:    'bg-violet-400',
    glow:     'shadow-violet-500/60',
    ring:     'ring-2 ring-fuchsia-300/70',
    cardBg:   'bg-gradient-to-br from-violet-50 via-fuchsia-50 to-amber-50 dark:from-violet-900/30 dark:via-fuchsia-900/20 dark:to-amber-900/20 border-violet-300 dark:border-violet-700',
  },
}
