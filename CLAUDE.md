@AGENTS.md

# Road to Massive

Application web mobile-first pour tracker les séances de musculation à BasicFit.

## Stack

- Next.js 16 (App Router, TypeScript)
- Drizzle ORM + Neon (PostgreSQL serverless)
- Tailwind CSS v4 + shadcn/ui
- Auth : bcryptjs + JWT (jose) en cookie httpOnly, middleware Next.js

## Design Conventions

Design **dark, bold et athlétique** pensé pour l'usage mobile en salle.

### Principes
- **Dark mode exclusif** : fond near-black avec surfaces dark gray
- **Orange vif** comme accent principal (#FE6B00 via oklch) — gradients, boutons, barres de progression
- **Typographie bold** : Geist font, titres en gras, tracking serré
- **Micro-interactions** : `card-hover` (scale down au tap), transitions douces, `glow-orange` subtil
- **Composants shadcn** avec thème dark + orange via CSS variables

### Utilitaires CSS custom
- `.text-gradient-orange` : texte en dégradé orange
- `.bg-gradient-orange` : fond en dégradé orange (boutons, barres de graphique)
- `.glow-orange` : box-shadow orange subtil (stats cards)
- `.card-hover` : scale(0.98) au tap

### Patterns visuels récurrents
- Barre orange à gauche des cards : `border-l-2 border-l-primary/50`
- Stats en pills : `bg-primary/10 text-primary`
- Numéros de série en `text-primary/50`
- Back links : `hover:text-primary transition-colors`
- Inputs dark : `bg-secondary/50`

### Ne pas faire
- Pas de mode clair
- Pas d'emojis dans l'UI
- Pas de couleurs autres qu'orange/noir/gris
- Pas de fonts autres que Geist

## Base de données

- 5 tables : users, exercises, sessions (userId FK), session_exercises, sets
- Les exercices sont seedés (catalogue BasicFit, 34 machines)
- Cascade delete sur sessions -> session_exercises -> sets

## Structure clé

- `src/components/session-editor.tsx` : composant principal d'édition de séance
- `src/components/exercise-picker.tsx` : sheet bottom-slide pour choisir un exercice
- `src/app/sessions/[id]/page.tsx` : page de séance (éditable via SessionEditor)
- `src/app/sessions/new/page.tsx` : crée une session puis redirige vers /sessions/[id]
- `src/app/exercises/[id]/page.tsx` : page d'évolution par exercice (stats, graphique, historique)
