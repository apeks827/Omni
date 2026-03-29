# Design System

This is the design system for the Omni Task Manager application. It contains reusable components and design tokens that ensure consistency across the UI.

## Components

### Button

A customizable button component with various variants and sizes.

```tsx
import { Button } from './design-system'

// Basic usage
<Button>Click me</Button>

// With variant
<Button variant="secondary">Secondary</Button>

// With size
<Button size="lg">Large Button</Button>

// Loading state
<Button isLoading>Loading...</Button>

// With icons
<Button leftIcon={<Icon />}>With Icon</Button>
```

#### Props

| Prop      | Type                                                                                     | Default     | Description                  |
| --------- | ---------------------------------------------------------------------------------------- | ----------- | ---------------------------- |
| variant   | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'outline' \| 'ghost'` | `'primary'` | Visual style of the button   |
| size      | `'sm' \| 'md' \| 'lg'`                                                                   | `'md'`      | Size of the button           |
| isLoading | `boolean`                                                                                | `false`     | Show loading state           |
| leftIcon  | `ReactNode`                                                                              | `undefined` | Icon to show before children |
| rightIcon | `ReactNode`                                                                              | `undefined` | Icon to show after children  |

### Badge

A compact semantic status label for priorities, counts, and contextual metadata.

```tsx
import { Badge } from './design-system'

<Badge variant="success">done</Badge>
<Badge variant="warning">in progress</Badge>
```

### Text

A lightweight typography primitive for headings, body copy, and captions.

```tsx
import { Text } from './design-system'

<Text variant="h2">Task board</Text>
<Text variant="caption" color="gray600">Secondary copy</Text>
```

### Stack

A flexbox layout primitive for consistent vertical and horizontal spacing.

```tsx
import { Stack } from './design-system'

;<Stack spacing="lg">
  <Text>First block</Text>
  <Text>Second block</Text>
</Stack>
```

### Input

A customizable input component with label and helper text support.

```tsx
import { Input } from './design-system'

// Basic usage
<Input placeholder="Enter text" />

// With label
<Input label="Name" placeholder="Enter your name" />

// With error
<Input label="Email" error="Invalid email" />

// With helper text
<Input label="Password" helperText="Must be at least 8 characters" />
```

#### Props

| Prop       | Type      | Default     | Description                          |
| ---------- | --------- | ----------- | ------------------------------------ |
| label      | `string`  | `undefined` | Label text for the input             |
| error      | `string`  | `undefined` | Error message to display             |
| helperText | `string`  | `undefined` | Helper text to display               |
| fullWidth  | `boolean` | `false`     | Whether to make the input full width |

### Card

A container component for grouping related content.

```tsx
import { Card } from './design-system'

// Basic usage
<Card>
  <p>Card content</p>
</Card>

// With custom padding
<Card padding="lg">
  <p>Card content with large padding</p>
</Card>
```

#### Props

| Prop         | Type                                            | Default | Description                |
| ------------ | ----------------------------------------------- | ------- | -------------------------- |
| padding      | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'` | `'md'`  | Padding size for the card  |
| shadow       | `'sm' \| 'md' \| 'lg'`                          | `'sm'`  | Shadow level for the card  |
| borderRadius | `'sm' \| 'md' \| 'lg' \| 'full'`                | `'md'`  | Border radius for the card |

### Modal

A dialog component that overlays the main content.

```tsx
import { Modal } from './design-system'

// Basic usage
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <p>Modal content</p>
</Modal>

// With title
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
>
  <p>Modal content</p>
</Modal>

// With footer
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="danger" onClick={handleConfirm}>Delete</Button>
    </>
  }
>
  <p>Are you sure you want to delete this item?</p>
</Modal>
```

#### Props

| Prop    | Type                   | Default     | Description                   |
| ------- | ---------------------- | ----------- | ----------------------------- |
| isOpen  | `boolean`              | `false`     | Whether the modal is visible  |
| onClose | `() => void`           | -           | Callback when modal is closed |
| title   | `string`               | `undefined` | Title for the modal           |
| size    | `'sm' \| 'md' \| 'lg'` | `'md'`      | Size of the modal             |
| footer  | `ReactNode`            | `undefined` | Footer content for the modal  |

## Design Tokens

The design system uses consistent tokens for colors, spacing, typography, and more.

### Colors

- Primary: `#007bff`
- Secondary: `#6c757d`
- Success: `#28a745`
- Danger: `#dc3545`
- Warning: `#ffc107`
- Info: `#17a2b8`
- Light: `#f8f9fa`
- Dark: `#343a40`
- Grayscale: From `gray100` (#f8f9fa) to `gray900` (#212529)

### Spacing

- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- XXL: 48px

### Typography

- Font sizes: xs (0.75rem), sm (0.875rem), md (1rem), lg (1.25rem), xl (1.5rem), xxl (2rem)
- Font weights: normal (400), medium (500), semibold (600), bold (700)
- Line heights: none (1), tight (1.25), normal (1.5), relaxed (1.75)

### Shadows

- SM: Subtle shadow
- MD: Medium shadow
- LG: Large shadow

### Border Radius

- SM: 2px
- MD: 4px
- LG: 8px
- FULL: 9999px
