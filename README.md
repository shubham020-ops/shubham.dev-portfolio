# Shubham.dev Portfolio

Yeh responsive React portfolio hai jisme public website, MongoDB-backed content CMS, admin login, contact inbox aur Resend email notification integrated hain. Production mein ek hi Node server website aur API serve kar sakta hai.

## Abhi project mein kya hai

- Public site: Hero, About, Skills, Projects, Featured Showcase, Experience, Testimonials aur Contact sections.
- Projects, Experience aur Testimonials ke sections/navigation ab hamesha available hain. Jab tak aap apna real content publish nahi karte, yeh clean empty state dikhate hain.
- Admin CMS (`/admin`): site copy/SEO, projects, skills, experience, testimonials, navigation, social links, footer aur contact form choices edit/publish karne ke liye.
- Contact form: input validation, rate limit, MongoDB inbox, Resend notification attempt aur admin se failed email retry.
- Admin security: hashed password, HTTP-only session cookie, CSRF checks, login rate limit aur password change.
- Responsive project slider, project details modal, testimonial slider aur mobile/desktop experience timeline.
- Reduced-motion support, keyboard/focus support aur WebGL unavailable hone par visual fallback.

**Content note:** real job history, client projects, measurable results ya testimonial quotes apne aap nahi bhare gaye. Galat portfolio claims se bachne ke liye Projects, Experience aur Testimonials ke records aapko apne verified data se add karne hain.

## Folder map

```text
src/                  React website, sections, responsive UI, admin CMS aur API client
src/data/             Safe initial site copy aur database seed defaults
public/images/        Profile aur portfolio artwork assets
backend/src/config/   Environment aur MongoDB connection
backend/src/models/   Admin, portfolio content aur contact message schemas
backend/src/routes/   Public API, authentication, admin CMS aur contact endpoints
backend/src/services/ Validation, health checks aur Resend email service
backend/src/scripts/  Database seed/migration aur first-admin setup
backend/test/         Backend route/service tests
```

## 1. Requirements

- Node.js **20.19+** aur npm.
- MongoDB Atlas ya reachable MongoDB instance. Atlas mein database user banayein aur sirf apne development/deployment server ka IP allow karein.
- Contact form ke email notifications ke liye Resend API key aur Resend mein verified sending domain.
- Git ya kisi secure jagah par `.env` secrets commit/upload na karein.

## 2. Backend environment set karein

PowerShell terminal mein:

```powershell
cd C:\Users\lenovo\Desktop\my-portfolio\portfolio\backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

`backend/.env` mein yeh values set karein:

| Variable | Kab chahiye | Value |
|---|---|---|
| `MONGODB_URI` | Zaroori | MongoDB connection string; database ka naam bhi usmein dein. |
| `JWT_SECRET` | Zaroori | Kam se kam 32 characters ka random secret. |
| `RESEND_API_KEY` | Contact email ke liye zaroori | Resend ka private API key. |

JWT secret PowerShell mein generate karne ke liye:

```powershell
$secretBytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($secretBytes)
[Convert]::ToBase64String($secretBytes)
```

Local default API port `3001` hai. Local frontend ke liye alag frontend `.env` ki zaroorat nahi. Production same-origin setup mein `npm start` secure cookies aur `/api/v1` URL khud configure karta hai.

### Resend ko email bhejne layak banayein

1. Resend mein apna sending domain add karke verify karein. Sirf API key banana kaafi nahi hota.
2. Agar API key send-only/domain-scoped hai to `npm run create-admin` ke waqt verified sender email enter karein.
3. Sender email blank chhodne par app pehla verified Resend domain dhoondhegi; is case mein API key ko domain-list/read aur email-send access chahiye.
4. Admin setup mein diya email contact inbox recipient hota hai. Optional overrides: `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`. Alag frontend host ho tabhi `FRONTEND_URL`/`VITE_API_BASE_URL` configure karein.

## 3. Packages install karein aur initial database tayyar karein

Backend terminal mein:

```powershell
npm install
npm run create-admin
npm run seed
```

`create-admin` aapse admin/inbox email aur optional verified sender email poochega. Agar `ADMIN_PASSWORD` env mein set nahi hai to ek strong random password generate karke terminal par **ek baar** dikhayega. Use save karein; login ke baad Admin ke Account section se password badal sakte hain. Existing admin par command dobara password overwrite nahi karti.

`seed` khaali database ko initial safe content deta hai. Pehle se bane database par yeh existing CMS records overwrite nahi karta; sirf missing sections aur Projects/Experience/Testimonials navigation defaults add karta hai. Isse purane database ke content ko delete kiye bina naya page flow milta hai.

## 4. Local development chalayen

Backend terminal (`portfolio/backend`) mein:

```powershell
npm run dev
```

Ek doosra terminal kholkar project root mein:

```powershell
cd C:\Users\lenovo\Desktop\my-portfolio\portfolio
npm install
npm run dev
```

Browser URLs:

- Website: Vite ka printed URL; aam taur par `http://localhost:5173` ya `http://localhost:5174`
- Admin CMS: usi frontend URL ke aage `/admin`
- Backend health: `http://localhost:3001/api/v1/health`

Backend `FRONTEND_URL` exact origin allow karta hai; `http://localhost:5174/` jaise trailing slash ko bhi canonical origin mein normalize karta hai. Local default allowlist sirf localhost ports `5173` aur `5174` hain. Development mein `CSP_CONNECT_SOURCES` set karne ki zaroorat nahi; yeh production mein separately hosted HTTPS API ke liye hai.

## 5. Projects, Experience aur Testimonials publish karein

1. `/admin` par create-admin mein banaye email/password se sign in karein.
2. **Projects** kholein, **Add** dabayein aur ek project record banayein. Required fields: `id` (unique lowercase slug, jaise `portfolio-site`), `title`, `category`, `description`, `tech` (list). `image` mein local `/images/...` path ya HTTPS image URL dein. Live/repository/case-study URL optional hain.
3. Record save karne ke baad uska `published` toggle on karke save karein. Publish hone par woh Hero preview, Projects section aur project detail modal mein dikhega.
4. **Experience** mein apni real role/education add karein: `id`, `type`, `date`, `role`, `org`, `text`. Publish karte hi mobile vertical timeline aur desktop scrollable timeline update hongi.
5. **Testimonials** mein asli quote, naam, role/context aur rating add karein. Sirf permission ke saath quote publish karein.
6. Site kholkar check karein ki records aur navigation links visible hain. Admin changes same tab mein refresh hote hain; doosri open tab ko bhi update notification milti hai.

`public/images/` mein existing artwork files hain, jaise `/images/project-pulse.jpg`, `/images/project-orbit-learn.jpg`, `/images/project-nebula.jpg`, `/images/project-mosaic.jpg` aur `/images/project-aurora.jpg`. Wahi image chunein jo actual project ko sahi represent karti ho.

Admin list records ke liye Add/Edit/Delete, publish visibility aur up/down order controls deta hai. Nested values, jaise `tech`, `skills`, panels ya details, form mein JSON/text ke roop mein edit hote hain. Images ke liye upload service configured nahi hai—existing local asset ya HTTPS URL use karein.

## 6. Contact form aur admin inbox

- Public Contact form valid message ko MongoDB mein save karta hai; email notification ki problem hone par bhi saved message Admin inbox mein rehta hai.
- Contact notifications Resend ke zariye admin/inbox email par jaati hain. Admin **Contact inbox** mein status, failed email aur retry button dekh sakta hai.
- Resend ka `accepted` status provider ne request le li, iska signal hai; yeh final inbox delivery proof nahi hai. Actual delivery/bounce tracking ke liye optional Resend webhook aur `RESEND_WEBHOOK_SECRET` set karein.
- Message open karne par woh read mark hota hai; archive, restore aur confirm karke permanent delete kiya ja sakta hai.

## 7. Production build aur hosting

Same-origin deployment (recommended):

```powershell
# Project root
cd C:\Users\lenovo\Desktop\my-portfolio\portfolio
npm run build

# Backend terminal/folder
cd C:\Users\lenovo\Desktop\my-portfolio\portfolio\backend
npm start
```

`npm start` production mode enable karke backend ko API aur `../dist` website dono serve karata hai. Hosting platform par `MONGODB_URI`, `JWT_SECRET`, aur email enable karne ke liye `RESEND_API_KEY` ko **secret settings** mein set karein. Production ko HTTPS ke peeche deploy karein, MongoDB network allowlist configure karein, aur database backups enable karein. Local `.env` file deploy/commit na karein.

Proxy forwarded headers by default trust nahi hote (`TRUST_PROXY=false`). Agar hosting reverse proxy ke through request bhejti hai, hosting configuration se trusted proxy IP/subnet set karein; hop count sirf tab use karein jab API direct internet se reachable na ho aur proxy chain fixed ho. Safe public reads par 300 requests/minute, baaki API routes par 60/minute, login par 10/15 minutes aur contact/password change par 5/15 minutes limit hai. Health checks exempt hain. `REDIS_URL` set karne par counters Redis mein share hote hain; bina Redis local single-process memory fallback chalega. Multiple API instances ke liye Redis configure karein.

Agar frontend aur backend alag domains par hon, to frontend build ke samay `VITE_API_BASE_URL=https://api.example.com/api/v1` aur backend environment mein exact `FRONTEND_URL=https://portfolio.example.com`, `CSP_CONNECT_SOURCES=https://api.example.com` set karein. Production `FRONTEND_URL` HTTPS hona chahiye. Dono HTTPS origins aur credentialed cookies/CORS sahi configure hone chahiye.

Optional env settings: `PORT`, `TRUST_PROXY`, `REDIS_URL`, `MONGODB_MAX_POOL_SIZE`, `MONGODB_WAIT_QUEUE_TIMEOUT_MS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `FRONTEND_URL`, `CORS_ORIGINS`, `CSP_CONNECT_SOURCES`, `RESEND_WEBHOOK_SECRET`, `COOKIE_SAME_SITE`, `COOKIE_SECURE`.

## 8. Checks

Frontend build project root se:

```powershell
npm run build
```

Backend syntax aur automated checks `backend/` se:

```powershell
npm run check
npm test
```

MongoDB health verify karein:

```powershell
Invoke-RestMethod http://localhost:3001/api/v1/health
```

## 9. Main API routes

| Method | Route | Kaam |
|---|---|---|
| `GET` | `/api/v1/health` | API aur MongoDB connection status |
| `GET` | `/api/v1/portfolio` | Public published content |
| `GET` | `/api/v1/projects` | Public projects |
| `GET` | `/api/v1/skills` | Public skills |
| `POST` | `/api/v1/contact` | Contact validate/save/email notification attempt |
| `POST` | `/api/v1/auth/login` | Admin login aur session |
| `GET` | `/api/v1/auth/me` | Current admin session |
| `POST` | `/api/v1/auth/logout` | Logout |
| `PUT` | `/api/v1/auth/password` | Password change |
| `/api/v1/admin/*` | — | Protected dashboard, content CMS aur inbox operations |
| `POST` | `/api/v1/webhooks/resend` | Optional signed email status events |

Admin write routes ke liye signed-in session aur CSRF token required hain.

## 10. Ab aapko kya karna baaki hai

1. `backend/.env` mein apni MongoDB URI aur JWT secret add karein; email chahiye to Resend key bhi add karein.
2. Resend sending domain verify karein, phir backend mein `npm run create-admin` chalayein.
3. `npm run seed` chala kar defaults/missing nav links initialize karein.
4. Local dev ke liye backend aur frontend dono commands alag terminals mein chalayein.
5. Admin mein apne real projects, verified experience, permission wale testimonials, contact email aur social links add karke publish karein.
6. Build/tests/health check pass karne ke baad hosting provider ke secret settings, MongoDB allowlist aur HTTPS domain configure karke production deploy karein.

Code path mein sections, CMS, public API aur local checks configured hain. Real MongoDB persistence aur Resend email delivery aapki valid provider keys/domain par depend karti hai; in external credentials ke bina live deployment connection verify nahi ho sakta.
