# ⛏️ ATM10 Planner — Alina's Minecraft Planning Tool

Eine persönliche Web-App zum Planen und Tracken von Quests, Gebäuden und Items für das Minecraft-Modpack **All the Mods 10**. Die App ist vom reinen Tracker zum **Planungs- und Entscheidungs-Tool** gewachsen — mit Ziel-System, Ressourcenkalkulation und interaktivem Dependency-Graph.

---

## Features

### 🎯 Ziel-System (Goal Planner)
- Jedes Item oder jede Quest kann als **Ziel** gesetzt werden
- **Goal Creation Flow**: Beim Setzen eines Ziels öffnet sich ein Planungs-Modal:
  - Optionale **persönliche Notiz** (Warum ist das mein Ziel?)
  - **Unterziele (Subgoals)** direkt aus den direkten Abhängigkeiten auswählen
  - Bereits getrackte Nodes werden als gesetzt angezeigt (nicht doppelt)
- **Hierarchische Ziele**: Unterziele haben `parentGoalId` und erscheinen eingerückt unter dem Hauptziel
- Mehrere gleichzeitige Ziele werden unterstützt
- Pro Ziel:
  - **Fortschrittsbalken** mit done/available/locked Aufschlüsselung
  - **Notiz** (falls gesetzt) sichtbar auf der Ziel-Karte
  - **Unterziele** mit eigenem Mini-Fortschrittsbalken
  - **"Das solltest du jetzt tun"** — nächste entsperrte Schritte (blau)
  - **Blockiert durch** — noch gesperrte Vorbedingungen (rot)
  - **Ressourcenkalkulation** — rekursive Berechnung aller benötigten Materialien mit Mengen-Multiplikatoren
- Ziele persistent im localStorage (`atm10-goals-v1`)

### 📋 Quest-System
- Quests erstellen, bearbeiten, löschen (mit Undo)
- Status-Zyklen: Offen → In Arbeit → Erledigt
- Prioritäten: Niedrig / Mittel / Hoch
- Kategorien: Progression, Building, Farming, Exploration, Crafting, Automation
- **Abhängigkeiten**: Quests können auf andere aufbauen — gesperrte Quests werden mit 🔒 markiert
- **Questlines**: Parent-Child-Hierarchie für verschachtelte Quests
- Filtern nach Status, Priorität, nur Haupt-Questlines
- Suche nach Titel

### 📦 Item-Tracker
- Items mit Mod, Status, Grund, Zweck und Notizen tracken
- Status: Gesucht 🔍 / Sammle 📥 / Habe ich ✅
- **Echte Crafting-Ketten**: `requires`-Abhängigkeiten mit Mengenangabe (×8) ermöglichen rekursive Ressourcenberechnung (BOM-Kalkulation)
- Verknüpfte Items und Quests (klickbar im Detailpanel)
- Detailansicht als Seitenpanel — ohne Seitenwechsel
- Grid- und Listenansicht
- Filter nach Status und Mod, Suche nach Name

### 🗺️ Dependency Graph
- Interaktiver Graph aller Quests und Items mit ihren Abhängigkeiten
- **Ziel-Highlighting**: aktives Ziel (pink 🎯), nächste Schritte (blau ▶), Blocker (rot 🔒), Pfad zum Ziel (violett)
- Ziel direkt im Graph-Detailpanel setzen/entfernen
- Crafting-Mengen als Edge-Labels (×8)
- Filter: Status, Mod, Typ (Quests/Items)
- Detailpanel beim Klick auf einen Node: Abhängigkeiten, Crafting-Zutaten, Fortschritt

### 🏗️ Gebäude-Planer
- Gebäude mit Name, Ort, Stil, Status planen
- Anforderungslisten pro Gebäude
- Notizen & Inspo-Bereich
- **Screenshot-Upload**: Drag & Drop oder Klick — Bilder werden als Base64 im localStorage gespeichert
- Thumbnail-Leiste auf der Gebäude-Karte; Klick öffnet **Lightbox** mit Navigation (←/→) und Vollbild-Ansicht
- Status-Schnellwechsel direkt auf der Karte

### 🏠 Dashboard
- Fortschrittsbalken (erledigte Quests)
- Schnellübersicht: aktive Quests, Gebäude im Bau, gesuchte Items
- **Ziele-Widget**: aktive Ziele mit Fortschritt und nächsten Schritten
- Nächste offene Quests und Items auf einen Blick

---

## Tech Stack

| Technologie       | Version  |
|-------------------|----------|
| Next.js (App Router) | 16.2.1 |
| React             | 19       |
| TypeScript        | 5        |
| Tailwind CSS      | 4        |
| Zustand           | latest   |
| @xyflow/react     | 12       |
| lucide-react      | latest   |

---

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
pnpm install

# Dev-Server starten (läuft auf localhost:2710)
pnpm dev

# Alle Quality Gates (lint + typecheck)
pnpm gates

# Production Build
pnpm build
```

---

## Projektstruktur

```
src/
├── app/
│   ├── layout.tsx          # Root Layout mit AppShell
│   ├── page.tsx            # Dashboard (mit Ziele-Widget)
│   ├── goals/page.tsx      # Ziel-Planer mit Ressourcenkalkulation
│   ├── quests/page.tsx     # Quest-Verwaltung
│   ├── items/page.tsx      # Item-Tracker
│   ├── buildings/page.tsx  # Gebäude-Planer
│   └── graph/page.tsx      # Dependency Graph mit Highlighting
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx    # Sidebar-Shell + Store-Hydration
│   │   └── Sidebar.tsx     # Navigation
│   ├── ui/                 # Button, Badge, Input, Modal, EmptyState
│   ├── graph/
│   │   ├── GraphView.tsx   # ReactFlow Canvas
│   │   ├── GraphQuestNode.tsx  # Custom Node: Quest (mit Highlight-Styles)
│   │   └── GraphItemNode.tsx   # Custom Node: Item (mit Highlight-Styles)
│   ├── goals/              # GoalCreationModal (Planungs-Flow)
│   ├── quests/             # QuestCard, QuestForm
│   ├── buildings/          # BuildingCard (Lightbox), BuildingForm (Upload)
│   └── items/              # ItemCard, ItemForm, ItemDetail
│
├── lib/
│   ├── planning/
│   │   └── index.ts        # getRequiredNodes, getNextSteps, getBlockers, calculateResources, getGoalProgress
│   ├── progression/
│   │   └── index.ts        # getNodeState, isUnlocked, getDependencyChain
│   └── graph/
│       ├── convert.ts      # convertNodesToGraph (mit Highlight-Sets)
│       └── layout.ts       # applyAutoLayout (dagre)
│
├── store/
│   ├── useQuestStore.ts    # Zustand + localStorage (atm10-quests-v2)
│   ├── useBuildingStore.ts # Zustand + localStorage (atm10-buildings-v2)
│   ├── useItemStore.ts     # Zustand + localStorage (atm10-items-v2)
│   └── useGoalStore.ts     # Zustand + localStorage (atm10-goals-v1)
│
├── types/
│   └── index.ts            # QuestNode, ItemNode, BuildingNode, Goal, Dependency, AnyNode
│
└── data/
    └── mockData.ts         # Beispieldaten mit echten Crafting-Ketten
```

---

## Datenpersistenz

Alle Daten werden automatisch im **localStorage** des Browsers gespeichert:

| Store     | localStorage-Key     |
|-----------|----------------------|
| Quests    | `atm10-quests-v2`    |
| Gebäude   | `atm10-buildings-v2` |
| Items     | `atm10-items-v2`     |
| Ziele     | `atm10-goals-v1`     |

> Die Daten bleiben nach einem Reload erhalten. Sie sind nur lokal im Browser gespeichert — kein Server, keine Datenbank.

---

## Datenmodelle

### QuestNode
```ts
interface QuestNode {
  id: string; type: 'quest'
  title: string; description: string; notes: string
  status: 'open' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  category: 'progression' | 'building' | 'farming' | 'exploration' | 'crafting' | 'automation' | 'other'
  parentId: string | null        // für Questlines
  dependencies: Dependency[]     // requires / unlocks / related
  createdAt: string; updatedAt: string
}
```

### ItemNode
```ts
interface ItemNode {
  id: string; type: 'item'
  name: string; mod: string
  status: 'needed' | 'collecting' | 'have'
  reason: string; purpose: string; notes: string
  dependencies: Dependency[]     // requires (mit amount!) / related / unlocks
  createdAt: string; updatedAt: string
}
```

### Dependency
```ts
interface Dependency {
  targetId: string
  type: 'requires' | 'unlocks' | 'related'
  amount?: number   // Crafting: wie viele von targetId werden benötigt? (aktiviert BOM-Kalkulation)
}
```

### Goal
```ts
interface Goal {
  id: string
  targetNodeId: string   // ID eines QuestNode oder ItemNode
  createdAt: string
  note?: string          // persönliche Notiz/Begründung für das Ziel
  parentGoalId?: string  // gesetzt wenn Unterziel eines anderen Ziels
}
```

---

## Planning Logic (`lib/planning/`)

Alle Planungs-Funktionen sind reine Funktionen ohne UI- oder Store-Imports:

| Funktion | Beschreibung |
|---|---|
| `getRequiredNodesForGoal(id, nodes)` | Alle transitiven `requires`-Abhängigkeiten |
| `getNextStepsForGoal(id, nodes)` | Entsperrte, nicht-fertige Nodes im Pfad |
| `getBlockingNodesForGoal(id, nodes)` | Gesperrte Nodes, die den Fortschritt blockieren |
| `getGoalProgress(id, nodes)` | `{ total, done, available, locked, percent }` |
| `calculateTotalResources(id, nodes)` | Rekursive BOM mit Mengen-Multiplikatoren |

Die Ressourcenberechnung traversiert den Dependency-Graphen rekursiv:
- ME Controller → 8× Fluix Crystal → je 1× Certus Seed → **8× Certus Seed** gesamt

---

## Bekannte Einschränkungen

- Keine Export-Funktion (JSON/CSV)
- Kein Dark Mode
- Keine echten Mod-API-Daten — nur Mock-Daten als Startpunkt
