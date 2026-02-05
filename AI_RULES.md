# AI Rules for This App

## Tech stack (quick overview)
- React + TypeScript
- React Router (routes defined in `src/App.tsx`)
- Tailwind CSS for all styling (utility-first classes)
- shadcn/ui component library (Radix UI-based)
- Radix UI primitives (already installed; used via shadcn/ui components)
- lucide-react for icons
- Source code lives in `src/`
- Page components live in `src/pages/`
- Reusable UI/components live in `src/components/`

## Library + architecture rules
1. **Routing**
   - Use **React Router** for navigation.
   - Keep route definitions **only** in `src/App.tsx`.

2. **UI components**
   - Prefer **shadcn/ui** components for all common UI (buttons, dialogs, forms, dropdowns, tables, etc.).
   - Do **not** edit files under `src/components/ui/*` (treat them as vendored).
   - If you need to customize behavior or composition, create a wrapper component in `src/components/`.

3. **Styling**
   - Use **Tailwind CSS** classes for styling.
   - Avoid adding new CSS files unless absolutely necessary.
   - Keep layout and spacing in Tailwind (e.g., `flex`, `grid`, `gap-*`, `p-*`, `max-w-*`).

4. **Icons**
   - Use **lucide-react** for icons.
   - Keep icon sizing/color controlled via Tailwind classes (e.g., `h-4 w-4`, `text-muted-foreground`).

5. **Pages vs components**
   - Put route-level screens in `src/pages/`.
   - Put reusable pieces in `src/components/`.
   - The default landing page is `src/pages/Index.tsx`; new visible UI should be wired in there (or via routes).

6. **State + logic**
   - Prefer local component state (`useState`, `useMemo`, `useCallback`) when possible.
   - Only introduce heavier state patterns if clearly needed and already part of the app.

7. **TypeScript**
   - Keep everything typed; avoid `any`.
   - Prefer explicit prop and function types for shared components.

8. **Simplicity and maintainability**
   - Make minimal, focused changes.
   - Create small, readable components rather than large monoliths.
   - Avoid overengineering error handling or abstractions unless required by the feature.
