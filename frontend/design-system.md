# Safe Harbor Design System

This design system is optimized for **React + TypeScript + Vite** projects and is structured to work cleanly with modern component-driven development and CSS variables.

---

# 1. Overview

This design system provides:

* Color tokens
* Typography tokens
* CSS variables
* Component styling standards
* React usage guidance
* Vite integration steps

Fonts used:

* **Playfair Display** (headings)
* **Inter** (body)

Color theme:

* Warm nonprofit aesthetic
* Gold primary accent
* Burgundy emotional accent
* Soft neutral backgrounds

---

# 2. Project Structure

Recommended structure:

```
src/
  assets/
  components/
  styles/
    tokens.css
    global.css
  App.tsx
  main.tsx
index.html
```

---

# 3. Install Fonts

Add to **index.html**:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;500;600&display=swap" rel="stylesheet">
```

---

# 4. Design Tokens

## Color Tokens

| Token              | Value   |
| ------------------ | ------- |
| primary            | #C09763 |
| burgundy           | #34242A |
| background-main    | #FAF9F7 |
| background-section | #E6DFDA |
| background-card    | #FFFFFF |
| background-soft    | #D4C7C4 |
| text-heading       | #0D0D0D |
| text-body          | #575052 |
| text-muted         | #8D8284 |
| border             | #B6ADAD |

---

## Typography Tokens

### Heading Font

```
Playfair Display
```

### Body Font

```
Inter
```

---

## Font Sizes

| Token   | Size |
| ------- | ---- |
| hero    | 48px |
| section | 32px |
| card    | 20px |
| body    | 16px |
| small   | 14px |

---

# 5. tokens.css

Create file:

```
src/styles/tokens.css
```

### tokens.css

```css
:root {
  /* Colors */
  --color-primary: #C09763;
  --color-burgundy: #34242A;

  --color-bg-main: #FAF9F7;
  --color-bg-section: #E6DFDA;
  --color-bg-card: #FFFFFF;
  --color-bg-soft: #D4C7C4;

  --color-text-heading: #0D0D0D;
  --color-text-body: #575052;
  --color-text-muted: #8D8284;

  --color-border: #B6ADAD;

  /* Fonts */
  --font-heading: "Playfair Display", serif;
  --font-body: "Inter", sans-serif;

  /* Font Sizes */
  --text-hero: 48px;
  --text-section: 32px;
  --text-card: 20px;
  --text-body: 16px;
  --text-small: 14px;

  /* Radius */
  --radius-card: 12px;
  --radius-button: 10px;

  /* Shadow */
  --shadow-soft: 0 4px 12px rgba(0,0,0,0.05);
}
```

---

# 6. global.css

Create file:

```
src/styles/global.css
```

```css
@import "./tokens.css";

body {
  margin: 0;
  font-family: var(--font-body);
  background: var(--color-bg-main);
  color: var(--color-text-body);
}

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  color: var(--color-text-heading);
  margin: 0;
}

h1 {
  font-size: var(--text-hero);
}

h2 {
  font-size: var(--text-section);
}

h3 {
  font-size: var(--text-card);
}

p {
  line-height: 1.6;
}
```

---

# 7. Buttons

```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: var(--radius-button);
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  background: white;
  color: var(--color-text-heading);
  border: 1px solid var(--color-border);
  padding: 12px 20px;
  border-radius: var(--radius-button);
  cursor: pointer;
}
```

---

# 8. Cards

```css
.card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-soft);
  padding: 20px;
}
```

---

# 9. React Usage

## main.tsx

```tsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./styles/global.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

# 10. Example Component

## Hero.tsx

```tsx
export default function Hero() {
  return (
    <section style={{ padding: "60px" }}>
      <h1>A journey from silence to voice</h1>

      <p>
        Each story within these walls represents a life reclaimed.
      </p>

      <button className="btn-primary">
        Support Our Work
      </button>
    </section>
  )
}
```

---

# 11. Usage Guidelines

## Do

* Use Playfair Display for headings
* Use Inter for all UI text
* Use gold for primary actions
* Use burgundy for emotional emphasis
* Keep background soft and neutral

## Avoid

* Bright saturated colors
* Multiple accent colors
* Heavy shadows
* Bold sans-serif headings

---

# 12. Future Extensions

Possible additions:

* Tailwind integration
* Component library
* Storybook
* Theme switching
* Dark mode

---

# 13. Summary

This design system provides:

* Consistent typography
* Clean color palette
* React/Vite ready structure
* Reusable CSS tokens
* Scalable component styling

You can now safely build UI components with consistent visual language across the entire frontend.
