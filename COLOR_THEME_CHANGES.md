# שינויי נושא הצבעים - גוון כחול

## סיכום השינויים
השמתי את נושא הצבעים של האתר לגוון כחול שולט, כמבוקש.

## קובצים שעודכנו:

### 1. `/src/themes/theme/index.js`
- החלפתי את משתנה `ktzdaka` ב-`blueTheme` עם פלטת צבעי כחול
- עדכנתי את הצבעים הראשיים (primary) לכחול Material Design
- שיפרתי את הצבעים המשניים (secondary) לגוונים של אפור-כחול
- עדכנתי את צבעי ה-info לתכלת
- שיפרתי את צבעי ה-success לירוק-כחול

### 2. `/src/App.css`
- עדכנתי את צבעי סרגל הגלילה לגוונים כחולים

### 3. `/src/config.js`
- עדכנתי את הצבעים החברתיים להתאים לנושא הכחול

### 4. רכיבים שעודכנו:
- `GenericTable/TooltipTypography.jsx` - עדכנתי צבעי tooltip
- `GenericTableM/TooltipTypography.jsx` - עדכנתי צבעי tooltip
- `GenericForm/index.jsx` - עדכנתי צבע הגבול
- `DragAndDropFiles/Drop.jsx` - עדכנתי צבע הרקע וצל
- `pages/Invoices/AddOrShow.jsx` - עדכנתי צבעי טקסט וגבול

## פלטת הצבעים החדשה:

### צבעים ראשיים (Primary - כחול):
- Lighter: `#e3f2fd`
- Light: `#64b5f6`
- Main: `#2196f3` (כחול עיקרי)
- Dark: `#1e88e5`
- Darker: `#1565c0`

### צבעים משניים (Secondary - אפור-כחול):
- Lighter: `#f8faff`
- Light: `#b0bec5`
- Main: `#78909c`
- Dark: `#37474f`
- Darker: `#1c1f21`

### צבעי מידע (Info - תכלת):
- Light: `#4fc3f7`
- Main: `#03a9f4`
- Dark: `#0288d1`

הצבעים נבחרו כדי ליצור הרמוניה ויזואלית עם כחול כצבע השולט, תוך שמירה על נגישות וקריאות טובה.