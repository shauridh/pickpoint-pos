# Create Super Admin User

## Masalah
Tidak bisa koneksi ke Supabase direct database dari lokal karena firewall.

## Solusi: Jalankan di Vercel

### Opsi 1: Gunakan Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI (jika belum)
npm i -g vercel

# 2. Link ke project Vercel
vercel link

# 3. Pull environment variables
vercel env pull .env.local

# 4. Jalankan di Vercel serverless function
vercel dev
# Kemudian akses: http://localhost:3000/api/admin-create
```

### Opsi 2: SQL Direct di Supabase Dashboard

1. Buka Supabase Dashboard
2. Pilih project > SQL Editor
3. Jalankan query ini:

```sql
-- Generate bcrypt hash untuk password "080802"
-- Hash: $2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-- (Gunakan online bcrypt generator untuk hash "080802")

INSERT INTO "User" (
  id, 
  username, 
  name, 
  phone, 
  pin, 
  role, 
  "isActive", 
  "createdAt", 
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'ridhos',
  'Super Admin',
  '08080200000',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGjLqpmzA4.Yv.HRR6', -- Hash untuk "080802"
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  pin = EXCLUDED.pin,
  role = 'ADMIN',
  "isActive" = true;
```

### Opsi 3: Create API Endpoint (Easiest)

Sudah saya buatkan endpoint di `/api/admin-create`. Setelah deploy:

1. Akses: `https://your-app.vercel.app/api/admin-create`
2. Endpoint akan create/update admin user
3. Response akan berisi status dan credentials

## Login Credentials

- URL: `/admin-login`
- Username: `ridhos`
- Password: `080802`

## Notes

- Script `scripts/create-admin.js` sudah siap, tapi perlu akses Supabase direct DB
- Untuk production, gunakan Supabase dashboard atau Vercel serverless function
- Jangan lupa hapus/protect endpoint `/api/admin-create` setelah admin dibuat
