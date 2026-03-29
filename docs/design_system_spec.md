# Design System Specification: Omni Task Manager

## Overview

This document outlines the design system for the Omni Task Manager application. It establishes consistent design tokens, components, and interaction patterns to ensure a cohesive user experience across all interfaces.

## Design Principles

1. **Intuitive**: Users should understand interactions without instruction
2. **Adaptive**: Interface should respond to user context and preferences
3. **Transparent**: System decisions should be explainable and understandable
4. **Efficient**: Minimize cognitive load and interaction steps

## Color Palette

- Primary: #007bff (Action buttons, primary elements)
- Secondary: #6c757d (Supporting elements, disabled states)
- Success: #28a745 (Completed tasks, positive actions)
- Danger: #dc3545 (Deletion, error states)
- Warning: #ffc107 (In-progress, attention-required)
- Info: #17a2b8 (Informational elements)
- Light: #f8f9fa (Backgrounds, subtle elements)
- Dark: #343a40 (Text, strong emphasis)

## Typography

- Headers: Roboto/Medium (600 weight) - 1.5rem, 1.25rem, 1rem
- Body: Roboto/Regular (400 weight) - 1rem, 0.875rem
- Captions: Roboto/Light (300 weight) - 0.75rem

## Spacing System

- Base unit: 8px
- Scale: 4px (xs), 8px (sm), 16px (md), 24px (lg), 32px (xl), 48px (xxl)

## Component Specifications

### Task Item Component

- Background: White with subtle shadow (box-shadow: 0 2px 4px rgba(0,0,0,0.1))
- Border: 1px solid #ddd
- Corner radius: 4px
- Content padding: 15px
- Status indicator: Color-coded pill (see color palette)
- Priority indicator: Colored badge with rounded corners
- Actions: Inline buttons for status toggle and deletion
- Hover state: Slight elevation increase (box-shadow: 0 4px 8px rgba(0,0,0,0.15))

### Form Components

- Input fields: 1px solid #ccc border, 4px corner radius, 8px padding
- Buttons: Primary (#007bff), Secondary (#6c757d), Success (#28a745), Danger (#dc3545)
- Select dropdowns: Match input field styling
- Focus states: Blue outline (primary color) with 2px width

### Layout Grid

- Container max-width: 900px
- Main content padding: 20px
- Responsive breakpoints:
  - Mobile: 320px - 768px
  - Tablet: 768px - 1024px
  - Desktop: 1024px+

## Accessibility Standards

- WCAG 2.1 AA compliance
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation support for all interactive elements
- Screen reader compatibility for all content
- Focus indicators visible for keyboard users
