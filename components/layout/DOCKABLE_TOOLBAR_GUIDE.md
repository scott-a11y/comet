# 🎯 Universal Dockable Toolbar System

## ✅ What I've Created

I've built a **universal dockable toolbar component** that works **across your entire application**, not just the wall designer!

---

## 📦 New Components

### 1. **`DockableToolbar`** - The Universal Toolbar
**Location**: `components/layout/DockableToolbar.tsx`

**Features**:
- ✅ **Docking controls** (← ↑ →) built-in
- ✅ **Compact mode** toggle
- ✅ **Automatic layout** based on dock position
- ✅ **Customizable** title, subtitle, settings
- ✅ **Responsive** design
- ✅ **Persistent** state (saves user preference)

### 2. **`DockableWorkspace`** - The Layout Wrapper
**Location**: Same file

**Features**:
- ✅ **Handles layout** automatically
- ✅ **Toolbar + Canvas** split
- ✅ **Responsive** to dock position changes

---

## 🚀 How to Use in ANY Page

### Basic Usage:

```tsx
import { DockableToolbar, DockableWorkspace } from "@/components/layout/DockableToolbar";

export default function MyPage() {
    return (
        <DockableWorkspace
            toolbar={
                <DockableToolbar title="My Tool" subtitle="v1.0">
                    {/* Your toolbar buttons go here */}
                    <button>Tool 1</button>
                    <button>Tool 2</button>
                    <button>Tool 3</button>
                </DockableToolbar>
            }
            canvas={
                <div>
                    {/* Your main content goes here */}
                    <h1>My Canvas</h1>
                </div>
            }
        />
    );
}
```

### Advanced Usage with Settings:

```tsx
<DockableToolbar
    title="Advanced Tool"
    subtitle="Pro Edition"
    showDockControls={true}  // Show ← ↑ → buttons
    showSettings={true}      // Show settings button
    onSettingsClick={() => setShowSettings(true)}
>
    {/* Your tools */}
</DockableToolbar>
```

---

## 🎨 Features Included

### 1. **Automatic Docking Controls**
Every toolbar automatically gets:
- **← Left** button
- **↑ Top** button  
- **→ Right** button

Click any button to instantly move the toolbar!

### 2. **Compact Mode**
- Click **"Collapse Sidebar →"** to minimize
- Click **→** icon to expand
- Perfect for maximizing canvas space

### 3. **Persistent State**
- User's dock position is **saved**
- Compact mode preference is **saved**
- Works across **all pages** using the same store

### 4. **Responsive Layout**
- **Vertical** layout when docked left/right
- **Horizontal** layout when docked top
- **Auto-adjusts** content flow

---

## 📋 Pages That Should Use This

### Current Pages to Update:
1. ✅ **Wall Designer** - Already has docking (needs migration to new component)
2. 🔄 **3D Viewer** (`app/buildings/[id]/3d/page.tsx`)
3. 🔄 **Equipment Page** (`app/equipment/new/page.tsx`)
4. 🔄 **Specs Page** (`app/specs/page.tsx`)
5. 🔄 **Debug Page** (`app/debug/page.tsx`)
6. 🔄 **Any page with a toolbar!**

---

## 🔧 Migration Guide

### Before (Old Way):
```tsx
<div className="flex">
    <div className="w-64 bg-slate-800">
        {/* Toolbar stuck on left */}
    </div>
    <div className="flex-1">
        {/* Canvas */}
    </div>
</div>
```

### After (New Way):
```tsx
<DockableWorkspace
    toolbar={
        <DockableToolbar title="My Tool">
            {/* Toolbar content - now dockable! */}
        </DockableToolbar>
    }
    canvas={
        {/* Canvas content */}
    }
/>
```

---

## 🎯 Benefits

### For Users:
- ✅ **Customize layout** to their preference
- ✅ **More screen space** with compact mode
- ✅ **Consistent experience** across all tools
- ✅ **Saved preferences** persist across sessions

### For Developers:
- ✅ **One component** for all toolbars
- ✅ **No layout code** to write
- ✅ **Automatic docking** logic
- ✅ **Consistent styling**

---

## 📝 Component API

### `DockableToolbar` Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Toolbar content |
| `title` | string | "Workspace" | Toolbar title |
| `subtitle` | string | undefined | Optional subtitle |
| `showDockControls` | boolean | true | Show ← ↑ → buttons |
| `showSettings` | boolean | false | Show settings button |
| `onSettingsClick` | function | undefined | Settings click handler |

### `DockableWorkspace` Props:

| Prop | Type | Description |
|------|------|-------------|
| `toolbar` | ReactNode | The toolbar component |
| `canvas` | ReactNode | The main content area |

---

## 🎨 Styling

The component uses your existing design system:
- **Slate colors** for dark theme
- **Blue accents** for active states
- **Backdrop blur** for modern look
- **Smooth transitions** for animations

---

## 🔄 Next Steps

### To Apply Everywhere:

1. **Update Wall Designer** to use new component
2. **Update 3D Viewer** to use new component
3. **Update Equipment pages** to use new component
4. **Update any other pages** with toolbars

### Example for 3D Viewer:
```tsx
// app/buildings/[id]/3d/page.tsx
import { DockableToolbar, DockableWorkspace } from "@/components/layout/DockableToolbar";

export default function ThreeDView() {
    return (
        <DockableWorkspace
            toolbar={
                <DockableToolbar title="3D Viewer" subtitle="Building Model">
                    <button>Rotate</button>
                    <button>Zoom</button>
                    <button>Pan</button>
                    {/* etc */}
                </DockableToolbar>
            }
            canvas={
                <Canvas>
                    {/* 3D scene */}
                </Canvas>
            }
        />
    );
}
```

---

## ✅ Status

- ✅ **Component Created**: `DockableToolbar.tsx`
- ✅ **Store Ready**: `use-workspace-store.ts`
- ✅ **Fully Typed**: TypeScript support
- ✅ **Tested**: Works with existing store
- 🔄 **Migration Needed**: Update existing pages

---

**Now ALL your toolbars can be docked anywhere the user wants!** 🎉

Just wrap any toolbar with `<DockableToolbar>` and any page with `<DockableWorkspace>` and you're done!
