# 🚀 Quick Deploy to Vercel - Next Steps

## ✅ Code Berhasil di Push ke GitHub!

Repository: https://github.com/pickpointsystem-prog/POS-Pickpoint

---

## 📋 Langkah Deployment ke Vercel

### Step 1: Import Project ke Vercel

1. **Buka Vercel**: https://vercel.com
2. **Login** dengan GitHub account Anda
3. **Klik "Add New Project"**
4. **Import** repository `pickpointsystem-prog/POS-Pickpoint`

### Step 2: Configure Environment Variables

Sebelum deploy, tambahkan environment variables berikut di Vercel:

```env
# Database (WAJIB)
DATABASE_URL=postgresql://postgres.emucobrjevodnbhxhhub:M0y14oE54Rype6Uj@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Session Secret (Generate baru)
SESSION_SECRET=your-random-32-char-secret-here

# VAPID Keys (Generate dengan: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Midtrans (Sandbox untuk testing)
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your-midtrans-client-key

# WhatsApp Gateway
WHATSAPP_API_URL=https://seen.getsender.id/send-message
WHATSAPP_API_KEY=yBMXcDk5iWz9MdEmyu8eBH2uhcytui
WHATSAPP_SENDER=6285777875132

# Courier API
COURIER_API_KEY=your-secure-random-key

# App URL (akan otomatis jadi your-app.vercel.app)
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

**Cara menambahkan di Vercel:**
- Saat import project, scroll ke bawah ke bagian **"Environment Variables"**
- Klik **"Add"** untuk setiap variable
- Paste key dan value
- Pilih environment: **Production**, **Preview**, dan **Development** (centang semua)

### Step 3: Deploy!

1. **Klik "Deploy"**
2. Tunggu ~2-3 menit
3. Vercel akan otomatis:
   - Install dependencies
   - Run `npm run build`
   - **Run Prisma migrations** (otomatis!)
   - Deploy ke production

### Step 4: Verifikasi Deployment

Setelah deploy sukses:

1. **Buka URL** yang diberikan Vercel (contoh: `https://pos-pickpoint.vercel.app`)
2. **Test Login**:
   - Buka `/login`
   - Coba register user baru
   - Login dengan PIN yang dibuat
3. **Test Admin**:
   - Buka `/admin`
   - Login dengan seeded admin user (jika ada)

---

## 🔧 Generate Secrets yang Dibutuhkan

### 1. Session Secret
```bash
# Di terminal lokal
openssl rand -base64 32
```

### 2. VAPID Keys
```bash
npx web-push generate-vapid-keys
```

Output akan seperti ini:
```
Public Key: BN...
Private Key: abc...
```

### 3. Courier API Key
```bash
openssl rand -hex 32
```

---

## ⚠️ Troubleshooting

### Build Failed: "Prisma migration error"

**Solusi**: Pastikan `DATABASE_URL` sudah benar dan menggunakan **connection pooling** (port 6543).

### Build Failed: "Module not found"

**Solusi**: 
```bash
# Di lokal, hapus node_modules dan reinstall
rm -rf node_modules package-lock.json
npm install
git add .
git commit -m "Fix dependencies"
git push
```

### Runtime Error: "Can't reach database"

**Solusi**: Cek apakah `DATABASE_URL` di Vercel environment variables sudah benar. Jangan lupa tambahkan `?pgbouncer=true` di akhir URL.

---

## 📊 Setelah Deploy Sukses

### 1. Setup Midtrans Webhook

Tambahkan webhook URL di Midtrans Dashboard:
```
https://your-app.vercel.app/api/midtrans/webhook
```

### 2. Test Notifications

- **Push Notification**: Buka app, allow notifications, test create package
- **WhatsApp**: Pastikan WhatsApp Gateway sudah aktif

### 3. Seed Database (Opsional)

Jika perlu seed data awal:
```bash
# Di terminal Vercel (atau lokal dengan DATABASE_URL production)
npx prisma db seed
```

---

## 🎯 Next Steps

1. ✅ **Deploy ke Vercel** (ikuti panduan di atas)
2. ✅ **Test semua fitur** di production
3. ✅ **Setup custom domain** (opsional)
4. ✅ **Monitor logs** di Vercel Dashboard
5. ⏳ **Migrate ke Coolify** (setelah 2-4 minggu testing)

---

## 📝 Important Notes

- **Database migrations** akan otomatis run saat deploy
- **Environment variables** bisa diupdate kapan saja di Vercel Dashboard
- **Setiap push ke GitHub** akan trigger auto-deploy
- **Vercel free tier** cukup untuk testing (100GB bandwidth/month)

---

**Selamat! Anda siap deploy! 🚀**

Jika ada masalah saat deployment, screenshot error message dan beri tahu saya.
