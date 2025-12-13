# AGENTS.md

## Project Scope
This repository contains ONLY the MOBILE FRONTEND
for a Human Resources Management application.

Platform:
- React Native
- Expo

This project is NOT a web app.
Do NOT generate web code.

---

## Mandatory Tech Stack
These technologies are NON-NEGOTIABLE:

- React Native (Expo)
- TypeScript
- Tamagui (all UI components)
- expo-router (navigation)
- Expo SecureStore (auth token storage)

Do NOT:
- Use Next.js
- Use HTML or CSS
- Use React Native Paper, NativeBase or other UI kits
- Mix UI libraries

---

## Backend Integration
- Backend is a Laravel REST API
- Authentication uses Laravel Sanctum
- Backend routes already exist

Rules:
- NEVER invent endpoints
- NEVER invent request or response fields
- ALWAYS read backend routes/controllers before coding
- Types must reflect real backend responses

---

## User Roles
Two roles exist:

### EMPLOYEE
- Can only access own data
- Limited routes under /employee/*

### ADMIN
- Full access
- Routes under /admin/*

Frontend navigation MUST respect backend permissions.

---

## Navigation Rules
- Use expo-router only
- EMPLOYEE: Bottom Tabs
- ADMIN: Stack or Drawer (mobile friendly)
- No desktop or web navigation patterns

---

## UI & Design System
- Use Tamagui components exclusively
- Use design tokens (spacing, colors, radius)
- Support light and dark mode
- Cards and lists instead of tables
- Mobile-first layouts only

---

## Animations & Motion
- Use subtle, professional animations
- Prefer Tamagui animations and Reanimated
- Animate:
  - Screen transitions
  - State changes
  - Button press feedback
- Avoid excessive or distracting motion
- Respect system “reduce motion” setting

---

## Code Quality Rules
- TypeScript everywhere
- Small, readable components
- No over-abstraction
- Centralized API services
- Typed API responses
- Clear folder structure

---

## Workflow Rules
- Work in phases
- Each phase must compile
- Do not break existing functionality
- Commit per phase

---

## Output Rules
- Prioritize correctness over visuals
- No mock data unless explicitly requested
- No placeholder APIs
- Explain code briefly when needed

---

## Final Reminder
If instructions conflict:
AGENTS.md takes priority over prompts.
