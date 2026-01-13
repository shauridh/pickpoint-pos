# Fix Vercel Database Connection

## Masalah
Error: "self-signed certificate in certificate chain" terjadi karena Supabase pooler connection tidak kompatibel dengan SSL mode di Vercel.

## Solusi

### Update Environment Variable di Vercel

1. Buka Vercel Dashboard: https://vercel.com/dashboard
2. Pilih project: pickpoint-pos
3. Masuk ke Settings > Environment Variables
4. Update `DATABASE_URL` menjadi:

```
postgresql://postgres.rnlyljpkiorvagecwxqp:o1EpxFzBjAmJQV5F@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true
```

**HAPUS parameter `&sslmode=require`** dari connection string.

5. Redeploy project dengan command:
```bash
git commit --allow-empty -m "trigger redeploy"
git push
```

Atau klik "Redeploy" di Vercel dashboard.

### Alternatif: Update via Vercel CLI

```bash
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
# Paste connection string tanpa sslmode=require
```

## Verifikasi

Setelah redeploy, test endpoint:
- https://pickpoint-pos.vercel.app/api/debug-db
- https://pickpoint-pos.vercel.app/api/admin-create

## Catatan
Code sudah diupdate untuk handle SSL dengan benar (`rejectUnauthorized: false`), tapi connection string juga perlu disesuaikan.
