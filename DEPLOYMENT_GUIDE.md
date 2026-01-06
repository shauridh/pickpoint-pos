# 🚀 Deployment Guide - PickPoint POS

## Deployment Strategy

### Recommended Approach
```
Phase 1: Quick Start (Vercel + Supabase)
  ↓ Test & validate
Phase 2: Production (Coolify self-hosted)
  ↓ Migrate when ready
```

---

## Phase 1: Quick Start (Vercel + Supabase)

### Why Start Here?
- ✅ **Fast**: Deploy in 10 minutes
- ✅ **Free tier**: Good for testing
- ✅ **Zero config**: Automatic HTTPS, CDN
- ✅ **Easy rollback**: Git-based deployments

### Step 1: Setup Supabase Database

1. **Create Project** at [supabase.com](https://supabase.com)
   - Sign up with GitHub
   - New Project → Choose region (Singapore for Indonesia)
   - Wait ~2 minutes for provisioning

2. **Get Connection String**
   ```
   Settings → Database → Connection string → Transaction mode
   ```
   
   Example:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

3. **Run Migrations**
   ```bash
   # Set DATABASE_URL locally
   echo 'DATABASE_URL="your-supabase-connection-string"' > .env.local
   
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

### Step 2: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/pickpoint-pos.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - New Project → Import from GitHub
   - Select `pickpoint-pos` repo

3. **Configure Environment Variables**
   ```env
   # Database
   DATABASE_URL=postgresql://postgres.[ref]:[password]@...
   
   # Session
   SESSION_SECRET=generate-with-openssl-rand-base64-32
   
   # VAPID (Web Push)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
   VAPID_PRIVATE_KEY=your-private-key
   VAPID_SUBJECT=mailto:your-email@example.com
   
   # Midtrans
   MIDTRANS_SERVER_KEY=your-server-key
   MIDTRANS_CLIENT_KEY=your-client-key
   MIDTRANS_IS_PRODUCTION=false
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your-client-key
   
   # WhatsApp
   WHATSAPP_API_URL=https://seen.getsender.id/send-message
   WHATSAPP_API_KEY=your-api-key
   WHATSAPP_SENDER=628xxx
   
   # Courier API
   COURIER_API_KEY=generate-random-key
   
   # App URL (will be your-app.vercel.app)
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes
   - Visit `https://your-app.vercel.app`

### Step 3: Test Everything

- [ ] Login works
- [ ] Register new user
- [ ] Create package
- [ ] Push notifications
- [ ] WhatsApp notifications
- [ ] Membership purchase
- [ ] Admin panel

---

## Phase 2: Production (Coolify Self-Hosted)

### Why Migrate to Coolify?
- ✅ **Cost**: $5-10/month vs $20-50/month
- ✅ **Control**: Full server access
- ✅ **Privacy**: Data stays on your server
- ✅ **Scalability**: Upgrade server as needed

### Prerequisites

1. **VPS Server** (choose one):
   - [Hetzner](https://hetzner.com) - €4.5/month (Germany)
   - [DigitalOcean](https://digitalocean.com) - $6/month
   - [Vultr](https://vultr.com) - $6/month
   - [Contabo](https://contabo.com) - €5/month
   
   **Specs**: 2 CPU, 4GB RAM, 80GB SSD

2. **Domain Name**
   - Buy from Cloudflare, Namecheap, etc.
   - Point A record to your VPS IP

### Step 1: Install Coolify

```bash
# SSH to your VPS
ssh root@your-server-ip

# Install Coolify (one command)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Access Coolify
# Open: http://your-server-ip:8000
```

### Step 2: Setup PostgreSQL in Coolify

1. **Create Database**
   - Resources → New → Database → PostgreSQL 16
   - Name: `pickpoint-db`
   - Set password
   - Deploy

2. **Get Connection String**
   ```
   postgresql://postgres:password@pickpoint-db:5432/postgres
   ```

3. **Run Migrations** (from local)
   ```bash
   # Connect to Coolify PostgreSQL
   DATABASE_URL="postgresql://..." npm run db:migrate
   DATABASE_URL="postgresql://..." npm run db:seed
   ```

### Step 3: Deploy Next.js App

1. **Create Application**
   - Resources → New → Application
   - Source: GitHub repository
   - Branch: `main`
   - Build Pack: Nixpacks (auto-detect)

2. **Configure Build**
   ```bash
   # Build Command (auto-detected)
   npm run build
   
   # Start Command
   npm start
   
   # Port
   3000
   ```

3. **Environment Variables**
   - Same as Vercel setup
   - Update `DATABASE_URL` to Coolify PostgreSQL
   - Update `NEXT_PUBLIC_APP_URL` to your domain

4. **Domain Setup**
   - Settings → Domains
   - Add: `pickpoint.yourdomain.com`
   - Enable HTTPS (automatic Let's Encrypt)

5. **Deploy**
   - Click "Deploy"
   - Monitor logs
   - Visit your domain

---

## Migration: Vercel → Coolify

### Option 1: Fresh Start (Recommended)

**When**: If you're still testing, no production data

```bash
# 1. Setup Coolify (as above)
# 2. Run migrations on new database
# 3. Update DNS to point to Coolify
# 4. Done!
```

### Option 2: Data Migration

**When**: You have production users/data

#### Step 1: Backup Supabase Data

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Dump database
supabase db dump -f backup.sql
```

#### Step 2: Restore to Coolify PostgreSQL

```bash
# SSH to Coolify server
ssh root@your-server-ip

# Copy backup
scp backup.sql root@your-server-ip:/tmp/

# Restore
docker exec -i pickpoint-db psql -U postgres postgres < /tmp/backup.sql
```

#### Step 3: Update Environment Variables

```bash
# In Coolify app settings
DATABASE_URL=postgresql://postgres:password@pickpoint-db:5432/postgres
NEXT_PUBLIC_APP_URL=https://pickpoint.yourdomain.com
```

#### Step 4: DNS Cutover

```bash
# 1. Test Coolify deployment works
# 2. Update DNS A record to Coolify IP
# 3. Wait for propagation (5-30 minutes)
# 4. Verify new site works
# 5. Keep Vercel as backup for 1 week
```

---

## Cost Comparison

### Vercel + Supabase (Managed)

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | 100GB bandwidth | $20/month (Pro) |
| Supabase | 500MB DB, 2GB bandwidth | $25/month (Pro) |
| **Total** | **Free** (limits apply) | **$45/month** |

### Coolify (Self-Hosted)

| Service | Cost |
|---------|------|
| VPS (Hetzner 4GB) | €4.5/month (~$5) |
| Domain | $10/year (~$1/month) |
| Backups (optional) | $1/month |
| **Total** | **$7/month** |

**Savings**: $38/month ($456/year)

---

## Monitoring & Backups

### Vercel + Supabase
- ✅ Automatic backups (Supabase)
- ✅ Built-in monitoring
- ✅ Automatic SSL renewal

### Coolify
- ✅ Built-in monitoring dashboard
- ⚠️ **Setup backups manually**:

```bash
# Automated daily backups
# In Coolify: Database → Backups → Enable
# Frequency: Daily
# Retention: 7 days
```

---

## Troubleshooting

### Vercel Deployment Fails

**Error**: "Build exceeded maximum duration"
```bash
# Solution: Optimize build
# vercel.json
{
  "builds": [{
    "src": "package.json",
    "use": "@vercel/next",
    "config": {
      "maxDuration": 60
    }
  }]
}
```

### Coolify Database Connection Fails

**Error**: "Connection refused"
```bash
# Check database is running
docker ps | grep postgres

# Check internal network
docker network inspect coolify

# Update DATABASE_URL to use internal hostname
DATABASE_URL=postgresql://postgres:password@pickpoint-db:5432/postgres
```

### Migration Data Loss

**Prevention**:
```bash
# Always test migration first
1. Backup Supabase data
2. Restore to Coolify
3. Test app with Coolify DB
4. Keep Vercel running during migration
5. Only switch DNS after confirming Coolify works
```

---

## Recommended Timeline

### Week 1: Quick Start
- Day 1: Deploy to Vercel + Supabase
- Day 2-7: Test all features, fix bugs

### Week 2: Prepare Migration
- Day 8: Buy VPS, install Coolify
- Day 9: Setup PostgreSQL in Coolify
- Day 10: Deploy app to Coolify (test domain)
- Day 11-14: Parallel testing (Vercel + Coolify)

### Week 3: Migration
- Day 15: Backup Supabase data
- Day 16: Restore to Coolify
- Day 17: Final testing
- Day 18: DNS cutover
- Day 19-21: Monitor, keep Vercel as backup

### Week 4: Cleanup
- Day 22: Confirm Coolify stable
- Day 23: Cancel Vercel/Supabase (if not needed)
- Day 24+: Production on Coolify

---

## Next Steps

### For Quick Start (Now)
1. ✅ Create Supabase account
2. ✅ Get connection string
3. ✅ Run migrations locally
4. ✅ Push to GitHub
5. ✅ Deploy to Vercel
6. ✅ Test everything

### For Migration (Later)
1. ⏳ Buy VPS when ready
2. ⏳ Install Coolify
3. ⏳ Test deployment
4. ⏳ Migrate data
5. ⏳ Switch DNS

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Coolify Docs**: https://coolify.io/docs
- **Coolify Discord**: https://discord.gg/coolify

---

**Recommendation**: Start with Vercel + Supabase untuk testing, migrate ke Coolify setelah 2-4 minggu ketika sudah yakin sistem stabil. Ini approach paling aman! 🚀
