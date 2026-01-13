# Post-Deployment Migration Guide

Setelah deploy aplikasi ke Vercel, jalankan migrasi database Prisma untuk memastikan schema Supabase terbaru.

## Cara Menjalankan Migrasi

### Opsi 1: Dari Local Machine (Recommended)

1. Pastikan `.env.local` sudah memiliki `DIRECT_DATABASE_URL` yang valid:
   ```
   DIRECT_DATABASE_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?schema=public&sslmode=require"
   ```

2. Jalankan command:
   ```bash
   npm run db:migrate:deploy
   ```

3. Tunggu migrasi selesai. Output akan menunjukkan:
   ```
   8 migrations found in prisma/migrations
   All migrations have been successfully applied.
   ```

### Opsi 2: Via Vercel CLI (Advanced)

Jika ingin menjalankan dari CI/CD atau Vercel environment:

```bash
vercel env pull  # Pull env vars dari Vercel
npm run db:migrate:deploy
```

## Environment Variables yang Diperlukan

Untuk migrasi berhasil, pastikan `DIRECT_DATABASE_URL` tersedia:

```
DIRECT_DATABASE_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?schema=public&sslmode=require"
```

Atau bisa dari `.env.example` di repo (sudah ada nilai default).

## Troubleshooting

### Error: "Can't reach database server"
- Pastikan koneksi internet stabil
- Verifikasi host `db.<project-ref>.supabase.co` accessible
- Cek IP firewall Supabase jika ada restrict

### Error: "Prepared statement already exists"
- Kemungkinan migrasi sudah berjalan. Cek status:
  ```bash
  npx prisma migrate status
  ```
- Jika stuck, hubungi Supabase support atau reset jika perlu

### Build Gagal di Vercel dengan DB Error
- Ini normal! Build tidak menjalankan migrasi. Jalankan migrasi post-deploy sesuai Opsi 1 atau 2.

## Build & Deployment Flow

1. **Build** (di Vercel): `npm run build` → Next.js compile only, no DB required
2. **Deploy**: Artifact di-deploy ke Vercel (memakan ~5-10 menit)
3. **Post-Deployment** (manual): `npm run db:migrate:deploy` → Prisma migrate Supabase schema

Ini memastikan deploy tidak tergantung DB connectivity saat build, dan migrasi bisa dijalan kapan saja.
