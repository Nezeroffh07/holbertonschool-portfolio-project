# TeamUp Platform (TUP) Portfolio for Nexus team

**TeamUp (TUP)** is a digital collaboration platform designed for university students and academics to seamlessly find team members for Capstone projects, startups, research, and hackathons.

## Problem Statement & Objective
In university environments, many great ideas fail simply because students struggle to find team members outside their immediate friend circles or faculties. **TeamUp** solves this by providing a centralized platform for skill matching, project showcases, and team application tracking.

## Tech Stack (Sprint 1 MVP)
- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens), Bcrypt
- **API Documentation:** Swagger / OpenAPI 3.0
##Features Implemented (Sprint 1)
### Backend
- [x] Initial Express.js project architecture setup
- [x] PostgreSQL database schema for Users
- [x] `POST /api/auth/signup` - User Registration API (Hashed Passwords)
- [x] `POST /api/auth/login` - User Authentication API (JWT Token generation)
- [x] Swagger UI documentation configured & active
### Frontend
- [x] Fully responsive Landing / Home Page (Desktop & Mobile support)
- [x] Unified Design System (Typography, Colors, Reusable Components)
- [x] Project showcase cards & Call-to-Action (CTA) sections
- [x] Static navigation paths ready for auth routing
## How to Run the Project Locally

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL

### Backend Setup
```bash
