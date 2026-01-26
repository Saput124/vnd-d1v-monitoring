# 🌱 VND D-One - Divisi D1V Monitoring System

> **Sistem monitoring aktivitas perkebunan tebu dengan role-based access control**

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Private-red.svg)]()

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

---

## 🎯 Overview

VND D-One adalah aplikasi web untuk monitoring dan tracking aktivitas perkebunan tebu divisi D1V. Sistem ini dirancang untuk:

- **Tracking progress** aktivitas pemeliharaan real-time
- **Manajemen vendor** dan pekerja lapangan
- **Monitoring luasan** yang sudah dikerjakan vs target
- **Role-based access** untuk berbagai level pengguna
- **Dashboard analytics** dengan visualisasi data

### Problem Solved

Sebelum aplikasi ini:
- ❌ Data aktivitas tersebar di Excel manual
- ❌ Sulit tracking progress real-time
- ❌ Koordinasi vendor tidak terpusat
- ❌ Laporan memakan waktu lama
- ❌ Tidak ada historical data yang terstruktur

Setelah menggunakan VND D-One:
- ✅ Data terpusat di database cloud
- ✅ Progress tracking otomatis
- ✅ Vendor input langsung via web/mobile
- ✅ Dashboard real-time
- ✅ Historical data lengkap & searchable

---

## ✨ Features

### 🔐 **Multi-Role Access Control**

| Role | Capabilities |
|------|--------------|
| **Admin** | • Full system access<br>• User management<br>• Activity & section setup<br>• Cross-section monitoring |
| **Section Head<br>Supervisor** | • Manage section data<br>• Block registration<br>• Transaction monitoring<br>• Section analytics |
| **Vendor** | • Input transactions<br>• Worker management<br>• View own progress<br>• Mobile-friendly |

### 📊 **Core Modules**

#### 1. Activity Management
- Define activity types (TANAM, KELENTEK, WEEDING, PANEN, dll)
- Assign activities to sections
- Active/inactive status control

#### 2. Block Registration
- Register blocks for specific activities
- Set target month & luasan
- Track execution progress (%)
- Multi-select block assignment

#### 3. Transaction Input
- Record field work transactions
- Support multiple blocks per transaction
- Worker tracking (manual or from list)
- Activity-specific data:
  - **TANAM**: Varietas
  - **PANEN**: Estimasi & actual ton
  - **WEED_CONTROL**: Herbisida & dosis

#### 4. Dashboard & Analytics
- Real-time progress monitoring
- Charts & visualizations:
  - Vendor performance ranking
  - Activity breakdown (pie chart)
  - Progress timeline (line chart)
- Advanced filtering:
  - By section, vendor, activity
  - Date range
  - Kategori & zone
  - Kondisi (ringan/sedang/berat)

#### 5. Master Data Management
- **Vendors**: Company info, contacts
- **Blocks**: Pool blok divisi (code, zone, kategori, varietas, luas)
- **Workers**: Daftar pekerja per vendor
- Bulk import from Excel

#### 6. Transaction History
- Complete transaction logs
- Detailed view per transaction:
  - Blocks worked
  - Workers involved
  - Materials used (herbicide)
- Export capability (planned)

### 🎨 **UI/UX Features**

- 📱 **Responsive design** - Works on desktop, tablet, mobile
- 🎨 **Modern interface** - Clean, intuitive Tailwind design
- 📈 **Interactive charts** - Recharts for data visualization
- 🔍 **Smart filters** - Multi-criteria search & filter
- ⚡ **Fast loading** - Optimized with Vite
- 💾 **Auto-save** - No data loss on form submission

---

## 🛠️ Tech Stack

### Frontend
```
React 18.2          → UI framework
Vite 5.0            → Build tool & dev server
Tailwind CSS 3.4    → Utility-first styling
Recharts 2.10       → Data visualization
Lucide React        → Icon library
date-fns            → Date manipulation
```

### Backend
```
Supabase            → Backend as a Service
PostgreSQL          → Database
Row Level Security  → Access control
Realtime (optional) → Live updates
Storage (optional)  → File uploads
```

### DevOps
```
Vercel              → Frontend hosting
GitHub              → Version control
npm/yarn            → Package management
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier OK)

### Installation

```bash
# 1. Clone repository
git clone <your-repo-url>
cd vnd-d1v-monitoring

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env and fill in Supabase credentials

# 4. Run development server
npm run dev

# App will open at http://localhost:5173
```

### Database Setup

1. Create new Supabase project
2. Copy SQL from `supabase_schema.sql`
3. Run in Supabase SQL Editor
4. Verify tables created in Table Editor

**⚠️ Important**: Don't skip database setup - app won't work without it!

### First Login

```
Username: admin
Password: admin123
```

---

## 📚 Documentation

Comprehensive documentation available:

| Document | Description |
|----------|-------------|
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | Complete setup instructions from scratch |
| **[DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md)** | Deploy to Vercel step-by-step |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical architecture & design decisions |
| **[supabase_schema.sql](./supabase_schema.sql)** | Complete database schema with comments |

### Quick Links

- 📖 [Setup Guide](./SETUP_GUIDE.md) - Start here if new
- 🚀 [Deployment Guide](./DEPLOYMENT_VERCEL.md) - Deploy to production
- 🏗️ [Architecture](./ARCHITECTURE.md) - Understand the system
- 🐛 [Troubleshooting](./SETUP_GUIDE.md#troubleshooting) - Common issues

---

## 📸 Screenshots

### Admin Dashboard
![Dashboard](./docs/screenshots/dashboard.png)
*Real-time analytics dengan filtering & charts*

### Block Registration
![Block Registration](./docs/screenshots/block-registration.png)
*Multi-select block assignment dengan progress tracking*

### Transaction Input (Vendor)
![Transaction Form](./docs/screenshots/transaction-form.png)
*Mobile-friendly transaction input*

### User Management
![User Management](./docs/screenshots/user-management.png)
*Role-based user & section management*

> **Note**: Add actual screenshots to `./docs/screenshots/` folder

---

## 🎯 Roadmap

### ✅ Completed (v1.0)
- [x] Multi-role authentication & authorization
- [x] Activity & section management
- [x] Block registration system
- [x] Transaction input & tracking
- [x] Real-time dashboard
- [x] Master data management
- [x] Transaction history

### 🚧 In Progress (v1.1)
- [ ] Export to Excel/PDF
- [ ] Email notifications
- [ ] Audit logs
- [ ] Mobile app (React Native)

### 📋 Planned (v2.0)
- [ ] File upload (photos, documents)
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Dark mode
- [ ] GPS tracking
- [ ] Weather integration

---

## 🤝 Contributing

### For Team Members

1. Create feature branch:
   ```bash
   git checkout -b feature/nama-fitur
   ```

2. Make changes & commit:
   ```bash
   git add .
   git commit -m "feat: deskripsi fitur"
   ```

3. Push & create PR:
   ```bash
   git push origin feature/nama-fitur
   ```

4. Request review from team lead

### Commit Convention

```
feat: New feature
fix: Bug fix
docs: Documentation
style: Formatting, missing semi-colons, etc
refactor: Code restructuring
test: Adding tests
chore: Maintenance
```

### Code Style

- Use ESLint + Prettier (config included)
- Follow React best practices
- Write meaningful component names
- Add comments for complex logic

---

## 🐛 Known Issues

### Current Limitations

1. **Password Storage**: Plain text (demo only) - Use bcrypt for production
2. **RLS Policies**: Allow-all for simplicity - Implement proper RLS for production
3. **No Real-time**: Manual refresh required - Add Supabase Realtime
4. **No File Upload**: Only text data - Add Supabase Storage if needed

### Reporting Bugs

Found a bug? Please create an issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment (browser, OS)

---

## 📞 Support

### Getting Help

1. **Check Documentation**: Most answers are in setup guide
2. **Search Issues**: Maybe already reported
3. **Ask Team**: Internal Slack/WhatsApp
4. **Create Issue**: If bug is confirmed

### Contact

- **Email**: dev@vnd.com
- **Slack**: #vnd-d1v-support
- **Phone**: +62 xxx-xxxx-xxxx (support hours: 8AM-5PM WIB)

---

## 📜 License

**Private & Confidential**

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

© 2025 VND D-One. All rights reserved.

---

## 🙏 Acknowledgments

Built with ❤️ by the VND D1V Development Team

**Special Thanks:**
- Supabase for amazing BaaS platform
- Vercel for free hosting
- React & Vite communities
- Open source contributors

---

## 📊 Project Stats

```
Lines of Code:     ~5,000
Components:        15+
Database Tables:   16
Test Coverage:     TBD
Active Users:      TBD
Uptime:            TBD
```

---

## 🔗 Quick Links

| Link | Purpose |
|------|---------|
| [Live Demo](https://your-app.vercel.app) | Try the app |
| [Supabase Dashboard](https://app.supabase.com) | Database admin |
| [Vercel Dashboard](https://vercel.com/dashboard) | Deployment status |
| [Documentation](./SETUP_GUIDE.md) | Full docs |
| [Issues](https://github.com/your-repo/issues) | Bug reports |
| [Releases](https://github.com/your-repo/releases) | Version history |

---

## 💡 Pro Tips

1. **For Admins**: Setup section activities FIRST before block registration
2. **For Vendors**: Use worker list feature instead of manual count for better tracking
3. **For Reports**: Use dashboard filters + date range for quick insights
4. **For Performance**: Clear browser cache if app feels slow
5. **For Mobile**: Add to homescreen for app-like experience

---

<div align="center">

**Made with ☕ by VND D1V Team**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/your-repo/issues) · [Request Feature](https://github.com/your-repo/issues)

</div>