# 🔧 Database Setup Guide

## Prerequisites

1. **PostgreSQL** installed locally or use cloud service:
   - Local: [PostgreSQL Download](https://www.postgresql.org/download/)
   - Cloud: [Supabase](https://supabase.com), [Neon](https://neon.tech), [Railway](https://railway.app)

## Quick Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL** (if not installed)
   ```bash
   # Windows: Download installer from postgresql.org
   # Mac: brew install postgresql
   # Linux: sudo apt install postgresql
   ```

2. **Create Database**
   ```bash
   # Login to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE pickpoint;
   
   # Create user (optional)
   CREATE USER pickpoint_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE pickpoint TO pickpoint_user;
   
   # Exit
   \q
   ```

3. **Create `.env.local`**
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/pickpoint?schema=public"
   SESSION_SECRET="generate-with-openssl-rand-base64-32"
   
   # Copy other variables from .env.example
   ```

4. **Run Migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

### Option 2: Supabase (Recommended for Quick Start)

1. **Create Project** at [supabase.com](https://supabase.com)

2. **Get Connection String**
   - Go to Project Settings → Database
   - Copy "Connection string" (Pooling mode)
   - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

3. **Create `.env.local`**
   ```env
   DATABASE_URL="your-supabase-connection-string"
   SESSION_SECRET="generate-random-32-char-string"
   ```

4. **Run Migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

### Option 3: Neon (Serverless Postgres)

1. **Create Project** at [neon.tech](https://neon.tech)

2. **Get Connection String**
   - Copy from dashboard
   - Format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb`

3. **Create `.env.local`** (same as above)

4. **Run Migrations** (same as above)

## Troubleshooting

### Error: "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string"

**Causes**:
1. Missing `DATABASE_URL` in `.env.local`
2. Incorrect connection string format
3. Special characters in password not URL-encoded

**Solutions**:

1. **Check `.env.local` exists**
   ```bash
   # Create from template
   cp .env.example .env.local
   ```

2. **Verify connection string format**
   ```
   ✅ Correct:
   postgresql://user:password@host:5432/database?schema=public
   
   ❌ Wrong:
   postgresql://user@host:5432/database (missing password)
   postgresql://user:pass word@host:5432/db (space in password)
   ```

3. **URL-encode special characters in password**
   ```javascript
   // If password is: my@pass#word
   // Encode to: my%40pass%23word
   
   const password = "my@pass#word";
   const encoded = encodeURIComponent(password);
   // Result: my%40pass%23word
   ```

4. **Test connection**
   ```bash
   # Using psql
   psql "postgresql://user:password@host:5432/database"
   
   # Using Node.js
   node -e "const pg = require('pg'); const pool = new pg.Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()').then(r => console.log(r.rows)).catch(console.error)"
   ```

### Error: "Connection refused"

**Solutions**:
- Check PostgreSQL is running: `sudo service postgresql status`
- Check firewall allows port 5432
- Verify host/port in connection string

### Error: "Database does not exist"

**Solution**:
```bash
# Create database
psql -U postgres -c "CREATE DATABASE pickpoint;"
```

## Environment Variables Template

Create `.env.local` with:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/pickpoint?schema=public"

# Session
SESSION_SECRET="your-super-secret-min-32-chars"

# VAPID (Web Push)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:your-email@example.com"

# Midtrans
MIDTRANS_SERVER_KEY="your-server-key"
MIDTRANS_CLIENT_KEY="your-client-key"
MIDTRANS_IS_PRODUCTION="false"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="your-client-key"

# WhatsApp (GetSender.id)
WHATSAPP_API_URL="https://seen.getsender.id/send-message"
WHATSAPP_API_KEY="your-api-key"
WHATSAPP_SENDER="628xxx"

# Courier API
COURIER_API_KEY="your-secure-api-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Generate Secrets

```bash
# Session secret
openssl rand -base64 32

# VAPID keys
npx web-push generate-vapid-keys

# Courier API key
openssl rand -hex 32
```

## Database Schema

Run these commands in order:

```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. Create/update database schema
npm run db:migrate

# 3. Seed initial data
npm run db:seed
```

## Verify Setup

```bash
# Start dev server
npm run dev

# Check logs for errors
# Should see: "✓ Ready in Xs"
# No database errors
```

## Next Steps

After database is working:
1. ✅ Test login with seeded user
2. ✅ Test package creation
3. ✅ Test notifications
4. ✅ Test membership purchase
