# Admin Panel - Rootkit Development

A modern, fully-featured admin panel for a software development agency built with Next.js, TypeScript, and TailwindCSS.

## 🚀 Features

- **Dashboard Overview**: Total revenue, projects, clients, and active deadlines
- **Calendar & Deadlines**: Interactive calendar with drag & drop, edit, and delete events
- **Project Management**: Full CRUD with email assignment notifications
- **Revenue & Finance**: Track income, expenses, invoices with charts and export (PDF/CSV)
- **Team Management**: CRUD for team members with roles and availability
- **Settings**: Configurable agency details, tax rates, and invoice settings
- **Authentication**: Secure admin login with NextAuth

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Email**: Nodemailer (Gmail SMTP)
- **Charts**: Recharts
- **Calendar**: React Big Calendar
- **Forms**: React Hook Form with Zod validation

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Admin-Pannel-Rootkit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/admin-panel-rootkit

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here-change-in-production

   # Email (Nodemailer - Gmail)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=your-email@gmail.com
   ```

4. **Seed the database with admin user**
   ```bash
   npx ts-node scripts/seed.ts
   ```
   Default credentials:
   - Email: `admin@rootkit.dev`
   - Password: `admin123`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── calendar/          # Calendar page
│   ├── projects/          # Projects page
│   ├── revenue/           # Revenue page
│   ├── team/              # Team page
│   ├── settings/          # Settings page
│   └── login/             # Login page
├── components/            # Reusable UI components
├── lib/                   # Utility functions
├── models/                # Mongoose models
├── types/                 # TypeScript type definitions
└── scripts/               # Utility scripts
```

## 🔐 Authentication

The admin panel uses NextAuth.js for authentication. To create additional users, you can:

1. Use the seed script to create an admin user
2. Create users programmatically through the User model
3. Add a user registration page (not included by default)

## 📧 Email Configuration

To enable email notifications for project assignments:

1. Use Gmail SMTP (recommended for testing):
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password in `SMTP_PASSWORD`

2. For production, consider using services like:
   - SendGrid
   - AWS SES
   - Mailgun

## 🎨 UI/UX

- **Light Mode Theme**: Clean, minimalist design with light grays and blue accents
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Consistent Design**: Uses TailwindCSS utility classes for consistent styling
- **Icons**: Lucide React icons throughout the application

## 📊 Features Breakdown

### Dashboard
- Real-time statistics (revenue, projects, clients, deadlines)
- Quick links to main sections
- Clean, card-based layout

### Calendar
- Full calendar view (month, week, day)
- Drag & drop to reschedule events
- Color-coded event types
- Create, edit, and delete events

### Projects
- Full CRUD operations
- Status tracking (Pending, In Progress, Completed, On Hold)
- Assign team members via email
- Task management within projects

### Revenue
- Track income, expenses, and invoices
- Monthly overview charts
- Export to PDF or CSV
- Pending invoice tracking

### Team
- Manage team members
- Track hourly rates and availability
- View assigned projects
- Avatar support (optional)

### Settings
- Configure agency details
- Set tax rates
- Customize invoice settings
- Email signature configuration

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted with Node.js

## 🔧 Development

### Adding New Features

1. Create models in `models/` directory
2. Add API routes in `app/api/`
3. Create pages in `app/`
4. Build reusable components in `components/`

### Code Style

- Use TypeScript for type safety
- Follow Next.js App Router conventions
- Use TailwindCSS for styling
- Keep components modular and reusable

## 📝 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, please contact the development team.

---

Built with ❤️ by Rootkit Development

---
Last updated: January 2025
