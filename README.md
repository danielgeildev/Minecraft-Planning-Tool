# ⛏️ ATM10 Planner — Alina's Minecraft Planning Tool

Eine persönliche Web-App zum Planen und Tracken von Quests, Gebäuden und Items für das Minecraft-Modpack **All the Mods 10**. Die App ist vom reinen Tracker zum **Planungs- und Entscheidungs-Tool** gewachsen — mit Ziel-System, Ressourcenkalkulation, interaktivem Dependency-Graph und einem strukturierten Notizen-System.

---

## Features

### 📝 Notizen-System (Knowledge Hub) — NEU
- **Strukturierter Wissens-Hefter** — Gameplay-Tipps, YouTube-Notizen, Crafting-Ideen festhalten
- **Volltextsuche** über Titel, Inhalt und Tags — "Ritual Chamber" sofort finden
- **Tag-System** — Notizen kategorisieren und nach Tags filtern
- **Bilder** — Screenshots per Drag & Drop hochladen (IndexedDB, kein localStorage-Überlauf)
- **Verknüpfungen** — Notizen mit beliebigen Items, Quests und Gebäuden verknüpfen
- **Verwandte Notizen** erscheinen automatisch auf Item-, Quest- und Gebäude-Karten
- Persistent in localStorage (`atm10-notes-v1`); Bilder in IndexedDB

### 🎯 Ziel-System (Goal Planner)
- Jedes Item oder jede Quest kann als **Ziel** gesetzt werden
- **Goal Creation Flow**: Beim Setzen eines Ziels öffnet sich ein Planungs-Modal:
  - Optionale **persönliche Notiz** (Warum ist das mein Ziel?)
  - **Unterziele (Subgoals)** direkt aus den direkten Abhängigkeiten auswählen
- **Hierarchische Ziele**: Unterziele erscheinen eingerückt unter dem Hauptziel
- Pro Ziel:
  - **Fortschrittsbalken** mit done/available/locked Aufschlüsselung
  - **"Das solltest du jetzt tun"** — nächste entsperrte Schritte (blau)
  - **Blockiert durch** — noch gesperrte Vorbedingungen (rot)
  - **Ressourcenkalkulation** — rekursive Berechnung aller benötigten Materialien

### 📋 Quest-System
- Quests erstellen, bearbeiten, löschen (mit Undo)
- Status-Zyklen: Offen → In Arbeit → Erledigt
- Prioritäten: Niedrig / Mittel / Hoch
- Kategorien: Progression, Building, Farming, Exploration, Crafting, Automation
- **Abhängigkeiten**: Quests können auf andere aufbauen — gesperrte Quests mit 🔒 markiert
- **Questlines**: Parent-Child-Hierarchie für verschachtelte Quests
- Filter nach Status, Priorität, nur Haupt-Questlines; Suche nach Titel

### 📦 Item-Tracker
- Items mit Mod, Status, Grund, Zweck und Notizen tracken
- Status: Gesucht 🔍 / Sammle 📥 / Habe ich ✅
- **Echte Crafting-Ketten**: `requires`-Abhängigkeiten mit Mengenangabe aktivieren rekursive Ressourcenberechnung
- Detailansicht als Seitenpanel; Grid- und Listenansicht

### 🗺️ Dependency Graph (visueller Planer)
- Interaktiver Graph aller Quests, Items **und Gebäude** mit ihren Abhängigkeiten
- **Ziel-Highlighting**: aktives Ziel (pink), nächste Schritte (blau), Blocker (rot), Pfad (violett)
- **Neue Nodes direkt im Graph erstellen** — Quests und Gebäude per Modal
- **Abhängigkeiten zeichnen** — Handle ziehen erzeugt `requires`-Verbindung
- **Validierung in Echtzeit**: Selbst-Referenz, Duplikate und Kreisläufe abgelehnt
- **Edge auswählen + löschen** — Klick auf Kante, dann Schaltfläche oder Entf-Taste

### 🏗️ Gebäude-Planer
- Gebäude mit Name, Ort, Stil, Status planen
- **Screenshot-Upload**: Drag & Drop — Bilder in **IndexedDB** (kein localStorage-Überlauf)
- Thumbnail-Leiste mit Lightbox-Navigation
- **Im Dependency-Graph verknüpfbar** mit Items via `requires`-Kanten

### ⚙️ Einstellungen
- **Dark Mode** — animierter Toggle, persistent
- **JSON-Backup** — alle Daten exportieren / importieren
- **Daten-Reset** — alle Stores mit einem Klick zurücksetzen (mit Confirmation)

### 🌙 Dark Mode
- Vollständige dunkle Variante für alle Seiten und Komponenten
- Suchfelder, Ziele-Seite, Graph-Minimap — alle korrekt im Dark Mode

### 🏠 Dashboard
- Fortschrittsbalken (erledigte Quests)
- Schnellübersicht: aktive Quests, Gebäude im Bau, gesuchte Items
- **Ziele-Widget**: aktive Ziele mit Fortschritt und nächsten Schritten

---

## Tech Stack

| Technologie          | Version  |
|----------------------|----------|
| Next.js (App Router) | 16.2.1   |
| React                | 19       |
| TypeScript           | 5        |
| Tailwind CSS         | 4        |
| Zustand              | latest   |
| @xyflow/react        | 12       |
| lucide-react         | latest   |

---

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
pnpm install

# Dev-Server starten (läuft auf localhost:2710)
pnpm dev

# TypeScript-Check
npx tsc --noEmit

# Production Build
pnpm build
```

---

## Projektstruktur

```
src/
├── app/
│   ├── layout.tsx           # Root Layout mit AppShell
│   ├── page.tsx             # Dashboard
│   ├── goals/page.tsx       # Ziel-Planer mit Ressourcenkalkulation
│   ├── quests/page.tsx      # Quest-Verwaltung
│   ├── items/page.tsx       # Item-Tracker
│   ├── buildings/page.tsx   # Gebäude-Planer
│   ├── graph/page.tsx       # Dependency Graph
│   ├── notes/page.tsx       # Notizen-System mit Suche
│   └── settings/page.tsx    # Einstellungen (Dark Mode, Backup, Reset)
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx     # Sidebar-Shell + Store-Hydration
│   │   └── Sidebar.tsx      # Navigation
│   ├── ui/                  # Button, Badge, Input, Modal, EmptyState
│   ├── graph/               # GraphView, GraphQuestNode, GraphItemNode, GraphBuildingNode
│   ├── notes/               # NoteCard, NoteForm, NoteImage, RelatedNotes
│   ├── goals/               # GoalCreationModal
│   ├── quests/              # QuestCard, QuestForm
│   ├── buildings/           # BuildingCard, BuildingForm, BuildingImage
│   └── items/               # ItemCard, ItemForm, ItemDetail
│
├── lib/
│   ├── planning/index.ts    # getRequiredNodes, getNextSteps, getBlockers, calculateResources
│   ├── progression/index.ts # getNodeState, isUnlocked, getDependencyChain
│   ├── imageStorage.ts      # IndexedDB-Wrapper für Bilder (Building + Notes)
│   └── graph/               # convert, layout, validation, editing
│
├── store/
│   ├── useQuestStore.ts     # atm10-quests-v2
│   ├── useBuildingStore.ts  # atm10-buildings-v2
│   ├── useItemStore.ts      # atm10-items-v2
│   ├── useGoalStore.ts      # atm10-goals-v1
│   └── useNoteStore.ts      # atm10-notes-v1
│
├── types/
│   ├── index.ts             # QuestNode, ItemNode, Building, Goal, AnyNode
│   └── note.ts              # NoteNode
│
└── data/
    └── mockData.ts          # Beispieldaten mit Crafting-Ketten
```

---

## Datenpersistenz

| Store     | Schlüssel            | Bilder         |
|-----------|----------------------|----------------|
| Quests    | `atm10-quests-v2`    | –              |
| Gebäude   | `atm10-buildings-v2` | IndexedDB      |
| Items     | `atm10-items-v2`     | –              |
| Ziele     | `atm10-goals-v1`     | –              |
| Notizen   | `atm10-notes-v1`     | IndexedDB      |

> Alle Daten bleiben nach einem Reload erhalten. Nur lokal im Browser — kein Server, keine Datenbank.
> Bilder werden in IndexedDB gespeichert, nicht im localStorage, um QuotaExceededError zu vermeiden.

---

## Datenmodelle

### NoteNode
```ts
interface NoteNode {
  id: string
  title: string
  content: string
  images: string[]        // UUID-Schlüssel → IndexedDB
  tags: string[]
  linkedNodeIds: string[] // IDs von QuestNode | ItemNode | Building
  createdAt: string; updatedAt: string
}
```

### QuestNode
```ts
interface QuestNode {
  id: string; type: 'quest'
  title: string; description: string; notes: string
  status: 'open' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  category: 'progression' | 'building' | ...
  parentId: string | null
  dependencies: Dependency[]
  createdAt: string; updatedAt: string
}
```

### Dependency
```ts
interface Dependency {
  targetId: string
  type: 'requires' | 'related'
  amount?: number  // Crafting-Menge (aktiviert BOM-Kalkulation)
}
```

---

## Bekannte Einschränkungen

- Keine echten Mod-API-Daten — nur Mock-Daten als Startpunkt
- Graph: Node-Positionen werden nicht gespeichert (Layout wird bei jedem Laden neu berechnet)
