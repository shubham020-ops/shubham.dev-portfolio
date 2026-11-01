# Shubham.dev — Full-Stack Developer Portfolio

A modern, creative, and fully responsive developer portfolio built to showcase projects, skills, professional experience, and achievements through an immersive digital experience.

Shubham.dev features interactive visuals, smooth animations, a dynamic content management system (CMS), a secure admin dashboard, and a fully integrated contact management system.

The application is powered by React, Vite, Three.js, GSAP, Node.js, Express, and MongoDB. In production, a single Node.js server can serve both the frontend website and backend API.

---

## 🚀 Features

### Public Portfolio Website
- Modern, responsive, and interactive portfolio design.
- Animated Hero, About, Skills, Projects, Featured Showcase, Experience, Testimonials, and Contact sections.
- Interactive 3D visuals and smooth scrolling animations.
- Responsive project slider and project details modal.
- Animated testimonial slider.
- Mobile and desktop experience timelines.
- Dynamic content powered by MongoDB.
- Reduced-motion accessibility support.
- Keyboard navigation and focus accessibility.
- WebGL fallback for unsupported devices.

### Admin Dashboard & CMS
- Secure admin login and authentication.
- Dynamic website content management.
- Manage projects, skills, experience, and testimonials.
- Edit website copy and SEO information.
- Manage navigation links and social media links.
- Customize footer content and contact form choices.
- Publish and unpublish content.
- Reorder content using up/down controls.
- Manage contact form submissions through the admin inbox.

### Contact Management System
- Contact form validation.
- Rate limiting and spam protection.
- MongoDB-backed message storage.
- Resend email notification integration.
- Admin contact inbox.
- Email delivery status tracking.
- Failed email notification retry functionality.
- Message archive, restore, and permanent deletion.

### Security
- Password hashing.
- HTTP-only session cookies.
- CSRF protection.
- Login rate limiting.
- Password change functionality.
- Protected admin API routes.
- Environment-based secret management.

### Accessibility & Performance
- Responsive layouts for mobile, tablet, and desktop.
- Reduced-motion support.
- Keyboard and focus accessibility.
- WebGL fallback support.
- Optimized frontend production build.

**Content Policy:** Real professional experience, client projects, measurable results, and testimonial quotes are not automatically generated. Add only verified information to maintain the accuracy and credibility of your portfolio.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling | Tailwind CSS v4 |
| Animations | GSAP |
| 3D Graphics | Three.js, React Three Fiber |
| Sliders | Swiper |
| Smooth Scrolling | Lenis |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | Secure Session Cookies, CSRF |
| Email Service | Resend API |
| Testing | Backend Automated Tests |

---

## 📁 Project Structure

```text
portfolio/
│
├── public/
│   └── images/              # Portfolio images and artwork
│
├── src/
│   ├── components/          # Reusable UI components
│   ├── sections/             # Portfolio website sections
│   ├── data/                 # Initial site content and defaults
│   ├── services/             # API services and integrations
│   └── ...                   # Admin CMS and application files
│
├── backend/
│   ├── src/
│   │   ├── config/           # Environment and MongoDB configuration
│   │   ├── models/           # Database schemas and models
│   │   ├── routes/           # API routes and authentication
│   │   ├── services/         # Validation and email services
│   │   └── scripts/          # Database seed and admin setup
│   │
│   └── test/                 # Backend tests
│
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites

Before starting, make sure you have:

- Node.js 20.19 or later.
- npm package manager.
- MongoDB Atlas account or an accessible MongoDB instance.
- Resend API key for email notifications.
- A verified sending domain in Resend.
- Git installed on your system.

**Important:** Never commit or upload private environment files or credentials to GitHub.

### 2. Clone the Repository

```bash
git clone https://github.com/shubham020-ops/shubham.dev-portfolio.git

cd shubham.dev-portfolio
```

### 3. Backend Environment Configuration

Open PowerShell and navigate to the backend directory:

```powershell
cd C:\Users\lenovo\Desktop\my-portfolio\portfolio\backend

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}
```

Open `backend/.env` and configure the following environment variables:

| Variable | Requirement | Description |
|---|---|---|
| `MONGODB_URI` | Required | MongoDB connection string |
| `JWT_SECRET` | Required | Random secret containing at least 32 characters |
| `RESEND_API_KEY` | Required for email | Private Resend API key |

Generate a secure JWT secret using PowerShell:

```powershell
$secretBytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($secretBytes)
[Convert]::ToBase64String($secretBytes)
```

Copy the generated value into your `.env` file.

The default local backend port is `3001`.

The frontend does not require a separate environment file for the default local development configuration.

### 4. Configure Resend Email Notifications

To enable contact form email notifications:

1. Create a Resend account.
2. Add your sending domain.
3. Complete domain verification.
4. Generate a Resend API key.
5. Add the API key to `backend/.env`.
6. Configure a verified sender email if required.

If your API key is domain-scoped or send-only, provide a verified sender email during admin setup.

Optional email configuration:

```env
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
```

If the frontend and backend are hosted on separate domains, configure:

```env
FRONTEND_URL=
VITE_API_BASE_URL=
```

---

## 🗄️ Database & Admin Initialization

Navigate to the backend folder:

```powershell
cd backend
```

Install dependencies:

```bash
npm install
```

Create the first admin account:

```bash
npm run create-admin
```

Initialize the database:

```bash
npm run seed
```

During admin setup:

- Enter your admin email address.
- Enter your contact inbox email.
- Provide an optional verified sender email.
- If `ADMIN_PASSWORD` is not configured, the application generates a secure random password and displays it once in the terminal.

Save the generated password securely.

You can change your admin password later from the Account section of the dashboard.

**Database Seed Behavior:** The seed script initializes safe default content in an empty database. For an existing database, it does not overwrite existing CMS records. It only adds missing sections and default navigation links.

---

## 💻 Running the Project Locally

You need two separate terminal windows for local development.

### Terminal 1 — Start Backend

Navigate to the backend directory:

```bash
cd backend
```

Start the development server:

```bash
npm run dev
```

The backend API runs on:

```text
http://localhost:3001
```

### Terminal 2 — Start Frontend

Open another terminal in the project root:

```bash
npm install
npm run dev
```

Vite will display the local development URL.

Usually:

```text
http://localhost:5173
```

or

```text
http://localhost:5174
```

### Application URLs

| Application | URL |
|---|---|
| Public Website | http://localhost:5173 |
| Backend Health | http://localhost:3001/api/v1/health |

Use the actual Vite URL printed in your terminal if it selects another port.



---

## 📊 Managing Portfolio Content

The portfolio includes a dynamic Admin CMS.

Open:



Sign in using the credentials created during admin initialization.

### Projects Management

Navigate to the Projects section and select Add.

Required fields:

- `id` — Unique lowercase slug, such as `portfolio-site`.
- `title` — Project name.
- `category` — Project category.
- `description` — Project description.
- `tech` — Technology list.

Optional fields:

- `image`
- Live website URL.
- Repository URL.
- Case study URL.

After saving a project, enable its Published toggle to make it visible on the public website.

### Experience Management

Add your real professional experience or education information.

Required fields:

- `id`
- `type`
- `date`
- `role`
- `org`
- `text`

Published records appear in the mobile vertical timeline and desktop experience timeline.

### Testimonials Management

Add genuine testimonials containing:

- Actual testimonial quote.
- Person's name.
- Role or professional context.
- Rating.

Only publish testimonials with the person's permission.

### Other CMS Features

The admin dashboard also supports:

- Skills management.
- Website content and SEO management.
- Navigation customization.
- Social media links.
- Footer customization.
- Contact form options.
- Content publishing and ordering.

**Image Management:** The current project does not include a dedicated image upload service. Use existing local assets inside `public/images/` or provide HTTPS image URLs.

---

## 📩 Contact Form & Admin Inbox

The contact form is integrated with the Express backend and MongoDB.

### How It Works

1. A visitor submits the contact form.
2. The backend validates the submitted information.
3. The message is saved to MongoDB.
4. An email notification is attempted through Resend.
5. The admin can view the submitted message in the Contact Inbox.

Even if email delivery fails, the submitted message remains saved in MongoDB.

### Admin Inbox Features

- View submitted messages.
- Check email notification status.
- Retry failed email notifications.
- Mark messages as read.
- Archive and restore messages.
- Permanently delete messages after confirmation.

**Email Delivery Note:** A Resend `accepted` status means the provider accepted the request. It does not guarantee final inbox delivery.

For delivery and bounce event tracking, configure the optional Resend webhook using:



## 🚀 Production Build & Deployment

The application supports a same-origin production deployment where one Node.js server serves both the frontend and backend API.

### 1. Build the Frontend

From the project root:

```bash
npm run build
```

This generates the production frontend inside the `dist/` directory.

### 2. Start the Production Server

Navigate to the backend directory:

```bash
cd backend
```

Start the production server:

```bash
npm start
```

In production mode, the backend serves:

- Frontend website from `../dist`.
- Backend API through `/api/v1`.

### 3. Production Environment Variables

Configure the following values in your hosting provider's secure environment settings:

```env
MONGODB_URI=
JWT_SECRET=
RESEND_API_KEY=
```

Never upload actual production secrets to GitHub.

### 4. Production Security Checklist

Before deployment:

- Configure HTTPS.
- Verify MongoDB network access.
- Enable database backups.
- Configure secure environment variables.
- Verify the Resend sending domain.
- Test admin authentication.
- Test contact form submissions.
- Run frontend and backend tests.
- Verify production API health.

### 5. Rate Limiting

The application includes rate limiting:

| Endpoint Category | Limit |
|---|---|
| Safe public reads | 300 requests/minute |
| Other API routes | 60 requests/minute |
| Admin login | 10 requests/15 minutes |
| Contact and password change | 5 requests/15 minutes |

Health check routes are exempt.

For multiple API instances, configure Redis using `REDIS_URL` to share rate-limit counters.

Without Redis, the application uses an in-memory fallback for a single process.

### 6. Separate Frontend & Backend Hosting

If the frontend and backend are hosted on different domains, configure the frontend build with:

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
```

Configure the backend with:

```env
FRONTEND_URL=https://portfolio.example.com
CSP_CONNECT_SOURCES=https://api.example.com
```

Production frontend URLs must use HTTPS.

Ensure that credentialed CORS requests and secure cookies are configured correctly.

---

## 🔌 Main API Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | API and MongoDB health status |
| GET | `/api/v1/portfolio` | Published portfolio content |
| GET | `/api/v1/projects` | Public projects |
| GET | `/api/v1/skills` | Public skills |
| POST | `/api/v1/contact` | Validate, save, and notify contact messages |
| POST | `/api/v1/auth/login` | Admin authentication |
| GET | `/api/v1/auth/me` | Current admin session |
| POST | `/api/v1/auth/logout` | Admin logout |
| PUT | `/api/v1/auth/password` | Change admin password |
| `/api/v1/admin/*` | Protected | Admin dashboard, CMS, and inbox operations |
| POST | `/api/v1/webhooks/resend` | Optional signed email status events |

**Security:** All admin write routes require an authenticated session and a valid CSRF token.

---

## 🧪 Testing & Verification

### Frontend Production Build

Run from the project root:

```bash
npm run build
```

### Backend Checks

Run from the backend directory:

```bash
npm run check
npm test
```

### MongoDB & API Health Check

Make sure the backend server is running, then execute:

```powershell
Invoke-RestMethod http://localhost:3001/api/v1/health
```

Verify that the API and database connection are working correctly.

---

## 📌 Environment Configuration Reference

The project supports the following optional environment settings:

```env
PORT=
TRUST_PROXY=
REDIS_URL=
MONGODB_MAX_POOL_SIZE=
MONGODB_WAIT_QUEUE_TIMEOUT_MS=
ADMIN_EMAIL=
ADMIN_PASSWORD=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
FRONTEND_URL=
CORS_ORIGINS=
CSP_CONNECT_SOURCES=
RESEND_WEBHOOK_SECRET=
COOKIE_SAME_SITE=
COOKIE_SECURE=
```

Configure only the variables required by your deployment environment.

Keep all private credentials in secure environment files or your hosting provider's secret settings.

---

## ✅ Final Setup Checklist

Before using the portfolio in production:

- [ ] Configure MongoDB connection.
- [ ] Generate a secure JWT secret.
- [ ] Configure Resend API key if email notifications are required.
- [ ] Verify the Resend sending domain.
- [ ] Create the first admin account.
- [ ] Initialize the database.
- [ ] Start the frontend and backend.
- [ ] Add real projects and professional experience.
- [ ] Add verified testimonials with permission.
- [ ] Configure social media links and contact information.
- [ ] Run frontend production build.
- [ ] Run backend automated checks and tests.
- [ ] Verify the API health endpoint.
- [ ] Configure production HTTPS and environment secrets.
- [ ] Test the deployed website and admin dashboard.

---

## 👨‍💻 About the Developer

**Shubham Soni**

Creative Developer | Full-Stack Developer

I enjoy building modern, interactive, and visually engaging digital experiences by combining creative design, frontend engineering, and backend development.

**Portfolio:** Shubham.dev

---

## 📄 License

Add an appropriate license file to the repository if you intend to distribute or allow reuse of this project.

---

**Note:** The application code includes the portfolio sections, CMS, public API, and local verification scripts. Actual MongoDB persistence and Resend email delivery depend on valid external provider credentials and configuration. A successful local build alone does not verify a live production deployment.
