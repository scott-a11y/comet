# 🎯 COMET SHOP LAYOUT TOOL - KEYBOARD SHORTCUTS & ADMIN SETTINGS

**Last Updated:** January 9, 2026, 6:00 AM  
**Status:** Keyboard shortcuts partially implemented, Admin settings page needed

---

## ⌨️ **KEYBOARD SHORTCUTS (Implemented)**

### **Equipment Movement**
- **Arrow Keys** - Nudge equipment 0.1 feet in any direction
- **Shift + Arrow Keys** - Nudge equipment 1 foot (larger movements)
- **Drag with Mouse** - Free-form positioning

### **Equipment Actions**
- **R** - Rotate selected equipment 90°
- **L** - Lock/Unlock selected equipment position
- **Delete** - Remove equipment from layout (with confirmation)

### **Edit Operations**
- **Ctrl + Z** - Undo last change
- **Ctrl + Y** - Redo last undone change
- **Ctrl + C** - Copy selected equipment (to clipboard)
- **Ctrl + V** - Paste equipment (create duplicate)

### **View & Help**
- **?** - Show/hide keyboard shortcuts panel
- **Esc** - Deselect equipment
- **Tab** - Cycle through equipment

---

## 🛠️ **TOOLBAR FEATURES (To Be Added)**

### **Quick Actions Toolbar**
```
[Select] [Move] [Rotate] [Copy] [Delete] | [Undo] [Redo] | [Zoom In] [Zoom Out] [Fit] | [Grid] [Snap]
```

**Recommended Toolbar Buttons:**
1. **Selection Tools**
   - Select (pointer)
   - Multi-select (Shift+Click)
   - Select All (Ctrl+A)

2. **Transform Tools**
   - Move (M)
   - Rotate (R)
   - Scale (S) - for future use

3. **Edit Tools**
   - Copy (Ctrl+C)
   - Paste (Ctrl+V)
   - Delete (Del)
   - Duplicate (Ctrl+D)

4. **History**
   - Undo (Ctrl+Z)
   - Redo (Ctrl+Y)

5. **View Controls**
   - Zoom In (+)
   - Zoom Out (-)
   - Fit to Screen (F)
   - Actual Size (1)

6. **Grid & Snap**
   - Toggle Grid (G)
   - Snap to Grid (Ctrl+G)
   - Show Dimensions (D)

7. **Measurement Tools**
   - Ruler (measure distance)
   - Angle tool
   - Area calculator

---

## ⚙️ **ADMIN SETTINGS PAGE (To Be Implemented)**

### **Page Location:** `/settings` or `/admin`

### **Settings Categories:**

#### **1. Company Information**
```typescript
{
  companyName: string;
  address: string;
  phone: string;
  email: string;
  logo: File | null;
  website: string;
}
```

**UI Fields:**
- Company Name (text)
- Address (textarea)
- Phone Number (tel)
- Email (email)
- Logo Upload (file, max 2MB, PNG/JPG)
- Website (url)

---

#### **2. Default Measurements & Units**
```typescript
{
  defaultUnit: 'feet' | 'meters';
  defaultClearance: number; // feet
  defaultCeilingHeight: number; // feet
  gridSize: number; // feet per grid square
  snapToGrid: boolean;
  showDimensions: boolean;
}
```

**UI Fields:**
- Measurement Unit (dropdown: Feet, Meters)
- Default Equipment Clearance (number, default: 3 ft)
- Default Ceiling Height (number, default: 16 ft)
- Grid Size (number, default: 5 ft)
- Snap to Grid (checkbox, default: true)
- Show Dimensions (checkbox, default: true)

---

#### **3. Layout Preferences**
```typescript
{
  defaultWorkflowPriority: 'efficiency' | 'safety' | 'balanced';
  groupSimilarEquipment: boolean;
  placeNearUtilities: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // minutes
}
```

**UI Fields:**
- Default Workflow Priority (dropdown)
- Group Similar Equipment (checkbox)
- Place Near Utilities (checkbox)
- Auto-Save (checkbox)
- Auto-Save Interval (number, minutes)

---

#### **4. PDF Export Settings**
```typescript
{
  includeCompanyLogo: boolean;
  includeDate: boolean;
  includeEquipmentList: boolean;
  includeLegend: boolean;
  includeNotes: boolean;
  paperSize: 'letter' | 'legal' | 'A4' | 'A3';
  orientation: 'portrait' | 'landscape';
}
```

**UI Fields:**
- Include Company Logo (checkbox)
- Include Generation Date (checkbox)
- Include Equipment List (checkbox)
- Include Legend (checkbox)
- Include Notes Section (checkbox)
- Paper Size (dropdown)
- Orientation (radio: Portrait, Landscape)

---

#### **5. Equipment Defaults**
```typescript
{
  defaultCategories: string[]; // CNC, Saw, Sander, etc.
  requireDustByDefault: boolean;
  requireAirByDefault: boolean;
  requireElectricalByDefault: boolean;
  defaultVoltage: number; // 110, 220, 440
}
```

**UI Fields:**
- Equipment Categories (tag input, add/remove)
- Require Dust Collection by Default (checkbox)
- Require Compressed Air by Default (checkbox)
- Require Electrical by Default (checkbox)
- Default Voltage (dropdown: 110V, 220V, 440V)

---

#### **6. User Preferences**
```typescript
{
  theme: 'dark' | 'light' | 'auto';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: boolean;
  emailNotifications: boolean;
}
```

**UI Fields:**
- Theme (dropdown: Dark, Light, Auto)
- Language (dropdown: English, Spanish, etc.)
- Date Format (dropdown: MM/DD/YYYY, DD/MM/YYYY, etc.)
- Time Format (radio: 12-hour, 24-hour)
- In-App Notifications (checkbox)
- Email Notifications (checkbox)

---

#### **7. Integration Settings**
```typescript
{
  apiKey: string;
  webhookUrl: string;
  enableExternalSync: boolean;
  syncInterval: number; // minutes
}
```

**UI Fields:**
- API Key (text, masked)
- Webhook URL (url)
- Enable External Sync (checkbox)
- Sync Interval (number, minutes)

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Keyboard Shortcuts (Partially Done)**
- [x] Arrow keys for nudging
- [x] R for rotate
- [x] L for lock
- [x] Delete for remove
- [x] Ctrl+Z/Y for undo/redo
- [x] Ctrl+C for copy
- [ ] Ctrl+V for paste (needs backend support)
- [ ] ? for help panel
- [ ] Esc for deselect
- [ ] Tab for cycle selection

### **Phase 2: Toolbar (To Do)**
- [ ] Create toolbar component
- [ ] Add selection tools
- [ ] Add transform tools
- [ ] Add edit tools
- [ ] Add history buttons
- [ ] Add view controls
- [ ] Add grid/snap toggles
- [ ] Add measurement tools

### **Phase 3: Settings Page (To Do)**
- [ ] Create `/settings` route
- [ ] Create settings page layout
- [ ] Add company info section
- [ ] Add measurement defaults section
- [ ] Add layout preferences section
- [ ] Add PDF export settings section
- [ ] Add equipment defaults section
- [ ] Add user preferences section
- [ ] Add integration settings section
- [ ] Create settings API endpoints
- [ ] Add settings to database schema
- [ ] Implement settings persistence
- [ ] Apply settings throughout app

---

## 🎯 **RECOMMENDED NEXT STEPS**

### **Immediate (15-20 minutes)**
1. Complete keyboard shortcut implementation
2. Add visual shortcuts help panel (press ?)
3. Add toolbar with common actions

### **Short Term (30-45 minutes)**
1. Create settings page UI
2. Add company information form
3. Add measurement defaults form
4. Implement settings save/load

### **Medium Term (1-2 hours)**
1. Add all settings categories
2. Create settings database schema
3. Implement settings API
4. Apply settings throughout app
5. Add settings import/export

---

## 💡 **USAGE EXAMPLES**

### **Keyboard Shortcuts in Action:**
```
1. Select equipment (click)
2. Press Arrow keys to nudge into position
3. Press R to rotate if needed
4. Press L to lock position
5. Press Ctrl+S to save (or click Save button)
```

### **Settings Workflow:**
```
1. Navigate to /settings
2. Update Company Name: "ABC Woodworking"
3. Set Default Clearance: 4 feet
4. Enable "Group Similar Equipment"
5. Set Auto-Save: Every 5 minutes
6. Click "Save Settings"
7. Settings apply to all new layouts
```

---

## 🚀 **BENEFITS**

### **Keyboard Shortcuts:**
- ⚡ **Faster editing** - No mouse clicks needed
- 🎯 **Precision** - Exact nudging with arrow keys
- 🔄 **Undo/Redo** - Experiment without fear
- 📋 **Copy/Paste** - Duplicate equipment quickly

### **Admin Settings:**
- 🏢 **Company Branding** - Logo on all PDFs
- 📏 **Standardization** - Consistent measurements
- ⚙️ **Customization** - Tailored to your workflow
- 💾 **Persistence** - Settings saved per user/company

---

**Generated by Comet Development Team**  
**For: Enhanced User Experience & Workflow Efficiency**  
**Date: January 9, 2026**
