'use client'

import { useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, Upload, AlertTriangle, CheckCircle2, Moon, Sun, Trash2, Trophy } from 'lucide-react'
import { useDarkMode }           from '@/lib/useDarkMode'
import { deleteImages, isDataUrl } from '@/lib/imageStorage'
import { useQuestStore }         from '@/store/useQuestStore'
import { useItemStore }          from '@/store/useItemStore'
import { useBuildingStore }      from '@/store/useBuildingStore'
import { useGoalStore }          from '@/store/useGoalStore'
import { useNoteStore }          from '@/store/useNoteStore'
import { useInventoryStore }     from '@/store/useInventoryStore'
import { useSettingsStore }      from '@/store/useSettingsStore'
import { useAchievementStore }   from '@/store/useAchievementStore'
import { useProgressStore }      from '@/store/useProgressStore'
import { Button }                from '@/components/ui/Button'
import { ConfirmDialog }         from '@/components/ui/ConfirmDialog'
import { AccountTab }            from '@/components/settings/AccountTab'
import { useAuthStore }          from '@/store/useAuthStore'
import { ACHIEVEMENTS, RARITY_ORDER, RARITY_CONFIG } from '@/lib/achievements'
import type { QuestNode, ItemNode, Building, Goal, InventoryItem } from '@/types'
import type { NoteNode } from '@/types/note'
import type { XpLogEntry } from '@/store/useProgressStore'

// ─── Backup schema ────────────────────────────────────────────────────────────

const BACKUP_VERSION = 4

interface BackupData {
  version:    number
  exportedAt: string
  appVersion: string
  data: {
    quests:       QuestNode[]
    items:        ItemNode[]
    buildings:    Building[]
    goals:        Goal[]
    inventory:    InventoryItem[]
    notes:        NoteNode[]
    unlockedIds:  string[]
    progressXp?:  number
    progressLog?: XpLogEntry[]
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidBackup(value: unknown): value is BackupData {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  if (obj.appVersion !== 'atm10-tracker') return false
  if (typeof obj.version !== 'number') return false
  const data = obj.data as Record<string, unknown> | undefined
  if (!data) return false
  return (
    Array.isArray(data.quests)    &&
    Array.isArray(data.items)     &&
    Array.isArray(data.buildings) &&
    Array.isArray(data.goals)     &&
    Array.isArray(data.inventory)
    // notes is optional for v1 backup compatibility
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'account' | 'appearance' | 'backup' | 'achievements' | 'reset'

const ALL_TABS: { id: Tab; label: string; emoji: string; authOnly?: boolean }[] = [
  { id: 'account',      label: 'Account',        emoji: '👤', authOnly: true },
  { id: 'appearance',   label: 'Darstellung',   emoji: '🎨' },
  { id: 'backup',       label: 'Datensicherung', emoji: '💾' },
  { id: 'achievements', label: 'Achievements',   emoji: '🏆' },
  { id: 'reset',        label: 'Zurücksetzen',   emoji: '🗑️' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const fileInputRef                     = useRef<HTMLInputElement>(null)
  const { dark, toggle: toggleDark }     = useDarkMode()
  const { playerName, setPlayerName }    = useSettingsStore()
  const [nameInput, setNameInput]        = useState(playerName)

  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const TABS = ALL_TABS.filter(t => !t.authOnly || isAuthenticated)

  const searchParams = useSearchParams()
  const initialTab   = (TABS.some(t => t.id === searchParams.get('tab')) ? searchParams.get('tab') : (isAuthenticated ? 'account' : 'appearance')) as Tab
  const [activeTab, setActiveTab]         = useState<Tab>(initialTab)
  const [importError,   setImportError]   = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetSuccess,    setResetSuccess]    = useState(false)

  const unlockedIds       = useAchievementStore(s => s.unlockedIds)
  const replayAchievement = useAchievementStore(s => s.replayAchievement)

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const backup: BackupData = {
      version:    BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: 'atm10-tracker',
      data: {
        quests:      useQuestStore.getState().quests,
        items:       useItemStore.getState().items,
        buildings:   useBuildingStore.getState().buildings,
        goals:       useGoalStore.getState().goals,
        inventory:   useInventoryStore.getState().inventory,
        notes:       useNoteStore.getState().notes,
        unlockedIds: useAchievementStore.getState().unlockedIds,
        progressXp:  useProgressStore.getState().totalXp,
        progressLog: useProgressStore.getState().xpLog,
      },
    }

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const date = new Date().toISOString().slice(0, 10)

    const a = document.createElement('a')
    a.href     = url
    a.download = `atm10-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import ────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportSuccess(false)
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!isValidBackup(parsed)) {
          setImportError('Ungültige Backup-Datei. Bitte nur Dateien verwenden, die mit dieser App exportiert wurden.')
          return
        }
        setPendingBackup(parsed)
      } catch {
        setImportError('Die Datei konnte nicht gelesen werden. Ist es eine gültige JSON-Datei?')
      }
    }
    reader.onerror = () => setImportError('Fehler beim Lesen der Datei.')
    reader.readAsText(file)
  }

  const handleImportConfirm = () => {
    if (!pendingBackup) return
    const { quests, items, buildings, goals, inventory, notes, unlockedIds } = pendingBackup.data

    useQuestStore.setState({ quests, _dataVersion: 2 })
    useItemStore.setState({ items, _dataVersion: 2 })
    useBuildingStore.setState({ buildings, _dataVersion: 2 })
    useGoalStore.setState({ goals, _dataVersion: 2 })
    useInventoryStore.setState({ inventory })
    if (notes) useNoteStore.setState({ notes, _dataVersion: 2 })
    if (unlockedIds) useAchievementStore.setState({ unlockedIds, seenIds: [] })

    // Restore progress data if present
    const backupAny = pendingBackup.data as Record<string, unknown>
    if (Array.isArray(backupAny.progressLog)) {
      useProgressStore.setState({
        totalXp: typeof backupAny.progressXp === 'number' ? backupAny.progressXp : 0,
        xpLog: backupAny.progressLog,
      })
    }

    setPendingBackup(null)
    setImportSuccess(true)
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleResetConfirm = async () => {
    const imageKeys = [
      ...useBuildingStore.getState().buildings.flatMap(b => b.inspoPics.filter(p => !isDataUrl(p))),
      ...useNoteStore.getState().notes.flatMap(n => n.images.filter(r => !isDataUrl(r))),
    ]

    useQuestStore.setState({ quests: [], _dataVersion: 2, lastDeleted: null })
    useItemStore.setState({ items: [], _dataVersion: 2, lastDeleted: null })
    useBuildingStore.setState({ buildings: [], _dataVersion: 2 })
    useGoalStore.setState({ goals: [], _dataVersion: 2 })
    useInventoryStore.setState({ inventory: [] })
    useNoteStore.setState({ notes: [], _dataVersion: 2 })
    useAchievementStore.setState({ unlockedIds: [], seenIds: [], pendingQueue: [] })
    useProgressStore.setState({ totalXp: 0, xpLog: [], pendingXpToasts: [], pendingLevelUp: null })

    if (imageKeys.length > 0) await deleteImages(imageKeys)

    setShowResetDialog(false)
    setResetSuccess(true)
  }

  // ── Counts ────────────────────────────────────────────────────────────────

  const questCount    = useQuestStore(s => s.quests.length)
  const itemCount     = useItemStore(s => s.items.length)
  const buildingCount = useBuildingStore(s => s.buildings.length)
  const goalCount     = useGoalStore(s => s.goals.length)
  const noteCount     = useNoteStore(s => s.notes.length)

  // ── Achievements grouped by rarity ────────────────────────────────────────

  const achievementsByRarity = RARITY_ORDER.map(rarity => ({
    rarity,
    items: ACHIEVEMENTS.filter(a => a.rarity === rarity),
  }))

  const isMythicUnlocked = (id: string) => unlockedIds.includes(id)

  const renderEmoji = (emoji: string, className = 'text-2xl') =>
    emoji.startsWith('/') ? (
      <img src={emoji} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
    ) : (
      <span className={`${className} flex-shrink-0`}>{emoji}</span>
    )

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">⚙️ Einstellungen</h1>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Darstellung, Datensicherung & Achievements</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-rose-50 dark:bg-slate-800 rounded-2xl p-1 mb-5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}
            `}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Account tab ── */}
      {activeTab === 'account' && <AccountTab />}

      {/* ── Appearance tab ── */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-50 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">🎨 Darstellung</h2>
          </div>
          <div className="px-5 py-4 flex flex-col gap-5">

            {/* Player name */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Spielername</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Wird auf dem Dashboard angezeigt</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onBlur={() => setPlayerName(nameInput)}
                  onKeyDown={e => { if (e.key === 'Enter') setPlayerName(nameInput) }}
                  maxLength={24}
                  placeholder="Alina"
                  className="w-32 px-3 py-1.5 text-sm rounded-xl border border-rose-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>

            <div className="border-t border-rose-50 dark:border-slate-700" />

            {/* Dark mode */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Dark Mode</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Dunkles Design aktivieren</p>
              </div>
              <button
                onClick={toggleDark}
                aria-label={dark ? 'Dark Mode deaktivieren' : 'Dark Mode aktivieren'}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2
                  ${dark ? 'bg-pink-400 border-pink-400' : 'bg-gray-200 border-gray-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-flex h-full aspect-square items-center justify-center rounded-full bg-white shadow-sm
                    transition-transform duration-200
                    ${dark ? 'translate-x-5' : 'translate-x-0'}
                  `}
                >
                  {dark
                    ? <Moon size={10} className="text-pink-400" />
                    : <Sun  size={10} className="text-gray-400" />
                  }
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Backup tab ── */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-50 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">💾 Datensicherung</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Alle deine Daten werden nur lokal im Browser gespeichert. Exportiere regelmäßig ein Backup.
            </p>
          </div>

          <div className="px-5 py-5 flex flex-col gap-6">

            {/* Export */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Export</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  Exportiert alle Quests, Items, Gebäude, Ziele, Notizen und Inventar als JSON-Datei.
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <span className="font-medium">Hinweis:</span> Gebäude-Bilder werden <strong>nicht</strong> exportiert —
                sie sind im Browser-Speicher (IndexedDB) hinterlegt und bleiben auf diesem Gerät erhalten.
                Nach einem Import auf einem anderen Gerät müssen Bilder erneut hochgeladen werden.
              </div>
              <Button onClick={handleExport} className="gap-2 self-start">
                <Download size={14} />
                Backup herunterladen
              </Button>
            </div>

            <div className="border-t border-rose-50 dark:border-slate-700" />

            {/* Import */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Import</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  Stellt Daten aus einem zuvor exportierten Backup wieder her.
                </p>
              </div>
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                <AlertTriangle size={11} className="inline mr-1" />
                <span className="font-medium">Achtung:</span> Der Import überschreibt <strong>alle</strong> aktuellen Daten unwiderruflich.
              </div>
              <Button
                variant="secondary"
                onClick={() => { setImportError(null); setImportSuccess(false); fileInputRef.current?.click() }}
                className="gap-2 self-start"
              >
                <Upload size={14} />
                Backup importieren
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />

              {importError && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                  <p>{importError}</p>
                </div>
              )}

              {importSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 size={13} />
                  <p>Import erfolgreich! Alle Daten wurden wiederhergestellt.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Achievements tab ── */}
      {activeTab === 'achievements' && (
        <div className="flex flex-col gap-4">

          {/* Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
              🏆
            </div>
            <div>
              <p className="text-base font-bold text-gray-800 dark:text-slate-100">
                {unlockedIds.length} / {ACHIEVEMENTS.length}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Achievements freigeschaltet</p>
              <div className="mt-1.5 h-1.5 w-40 rounded-full bg-rose-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-700"
                  style={{ width: `${(unlockedIds.length / ACHIEVEMENTS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Rarity groups */}
          {achievementsByRarity.map(({ rarity, items }) => {
            const cfg        = RARITY_CONFIG[rarity]
            const groupDone  = items.filter(a => unlockedIds.includes(a.id)).length
            return (
              <div key={rarity}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${cfg.gradient}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    {cfg.label}
                  </h3>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{groupDone}/{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map(a => {
                    const unlocked = isMythicUnlocked(a.id)
                    const isSecret = a.secret === true
                    const hidden   = isSecret && !unlocked
                    const Tag      = unlocked ? 'button' : 'div'
                    return (
                      <Tag
                        key={a.id}
                        {...(unlocked ? {
                          onClick: () => replayAchievement(a.id),
                          title: 'Effekt nochmal abspielen',
                        } : {})}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all w-full text-left
                          ${unlocked
                            ? `${cfg.cardBg} ${cfg.ring} hover:opacity-80 active:scale-[0.98] cursor-pointer`
                            : hidden
                              ? 'bg-gradient-to-r from-violet-950/60 via-fuchsia-950/60 to-pink-950/60 border-violet-800/50 dark:border-violet-700/50'
                              : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 opacity-50 grayscale'}
                        `}
                      >
                        <span className={`flex-shrink-0 ${!unlocked && !hidden ? 'opacity-40' : ''}`}>
                          {unlocked ? renderEmoji(a.emoji) : hidden ? <span className="text-2xl">✨</span> : <span className="text-2xl">🔒</span>}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${hidden ? 'text-violet-300' : 'text-gray-800 dark:text-slate-100'}`}>
                            {hidden ? '???' : a.title}
                          </p>
                          <p className={`text-xs mt-0.5 ${hidden ? 'text-violet-400/70' : 'text-gray-500 dark:text-slate-400'}`}>
                            {hidden ? 'Geheimes Achievement – entdecke es selbst!' : a.description}
                          </p>
                        </div>
                        {unlocked && (
                          <Trophy size={14} className={`flex-shrink-0 ${a.rarity === 'mythic' ? 'text-violet-400' : 'text-amber-400'}`} />
                        )}
                      </Tag>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Reset tab ── */}
      {activeTab === 'reset' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-50 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">🗑️ Alle Daten löschen</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Setzt die App auf den Ausgangszustand zurück.
            </p>
          </div>

          <div className="px-5 py-5 flex flex-col gap-4">

            <div className="rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 px-4 py-3 flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Folgende Daten werden gelöscht:</p>
              {[
                { label: 'Quests',   count: questCount,    emoji: '📋' },
                { label: 'Items',    count: itemCount,     emoji: '📦' },
                { label: 'Gebäude', count: buildingCount, emoji: '🏗️' },
                { label: 'Ziele',   count: goalCount,     emoji: '🎯' },
                { label: 'Notizen',      count: noteCount,        emoji: '📝' },
                { label: 'Achievements', count: unlockedIds.length, emoji: '🏆' },
                { label: 'Bilder',       count: null,               emoji: '🖼️' },
              ].map(({ label, count, emoji }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </span>
                  <span className="font-medium text-gray-700 dark:text-slate-200">
                    {count !== null ? `${count} Einträge` : 'alle (IndexedDB)'}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              <AlertTriangle size={11} className="inline mr-1" />
              <span className="font-medium">Achtung:</span> Diese Aktion ist <strong>unwiderruflich</strong>.
              Erstelle vorher ein Backup unter dem Tab &bdquo;Datensicherung&ldquo;.
            </div>

            {resetSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                <p>Alle Daten wurden erfolgreich gelöscht.</p>
              </div>
            )}

            <Button
              variant="danger"
              onClick={() => { setResetSuccess(false); setShowResetDialog(true) }}
              className="gap-2 self-start"
            >
              <Trash2 size={14} />
              Alle Daten löschen
            </Button>

          </div>
        </div>
      )}

      {/* Confirm import dialog */}
      <ConfirmDialog
        open={pendingBackup !== null}
        title="Backup importieren?"
        description="Dies überschreibt alle aktuellen Daten (Quests, Items, Gebäude, Ziele, Notizen, Inventar). Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Importieren"
        onConfirm={handleImportConfirm}
        onCancel={() => setPendingBackup(null)}
      />

      {/* Confirm reset dialog */}
      <ConfirmDialog
        open={showResetDialog}
        title="Alle Daten wirklich löschen?"
        description="Quests, Items, Gebäude, Ziele, Notizen, Inventar, Achievements und alle hochgeladenen Bilder werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Alles löschen"
        onConfirm={() => { void handleResetConfirm() }}
        onCancel={() => setShowResetDialog(false)}
      />
    </div>
  )
}
