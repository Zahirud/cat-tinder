# Cat Tinder

**Cat Tinder** is a fun web application inspired by the popular dating app concept, designed for cat lovers!  

Users can:  
- Swipe right to like or swipe left to pass on adorable cats.  
- View profiles of cats with pictures and basic info.  
- Connect with local shelters or adoption centers (optional future feature).  

---

## Tech Stack

### Frontend
- **React (CRA)** – main framework for building the SPA (Single-Page Application)  
- **JavaScript (ES6+)** – app logic, swipe detection, state management  
- **HTML5** – root template (`public/index.html`)  
- **CSS (inline styles)** – responsive styling, mobile-first layout  

### Backend / API
- **Cataas API** – Cat as a Service (random cat images)  
Example URL:  
```bash
https://cataas.com/cat?random=1
```
## UI/UX Features
- Pointer & touch events → swipe left/right on desktop & mobile
- Haptic feedback (`navigator.vibrate`) → small vibration on like/dislike (mobile)
- Undo logic → single-step undo of last swipe
- Summary view → shows liked cats at the end with count
- Responsive design → works smoothly on mobile & desktop

## Tooling
- **Node.js + npm** – package management
- **Git & GitHub** – version control and code hosting
- **Create React App (CRA)** – project scaffold

## Features
- Responsive UI for both desktop and mobile
- Real-time swiping interactions using React animation libraries
- API-driven architecture for future expansion

## Goal
To create a playful and engaging platform for cat enthusiasts to discover adoptable cats while learning full-stack development.
