# 📱 Panduan Test Notifikasi WhatsApp

## Persiapan

### 1. Konfigurasi WhatsApp Gateway

Tambahkan ke `.env.local`:

```env
# WhatsApp Gateway Configuration
WHATSAPP_API_URL=https://api.fonnte.com/send
WHATSAPP_API_KEY=your_fonnte_api_key_here
WHATSAPP_SENDER=6281234567890
```

**Provider yang didukung:**
- [Fonnte](https://fonnte.com) - Recommended, mudah setup
- [WooWA](https://woowa.id)
- [Wablas](https://wablas.com)
- [WAHA](https://waha.devlike.pro) - Self-hosted

### 2. Edit Nomor Test

Buka file `test-whatsapp.ts` dan ganti:

```typescript
const TEST_PHONE = "6281234567890"; // Ganti dengan nomor HP kamu!
```

## Cara Test

### Opsi 1: Menggunakan Test Script (Recommended)

```bash
# Jalankan test script
npx tsx test-whatsapp.ts
```

Script ini akan mengirim 3 notifikasi test:
1. ✅ Paket Tiba
2. ✅ Membership Success  
3. ✅ Membership Reminder

### Opsi 2: Test Manual via Admin Panel

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Login ke Admin Panel:**
   - Buka http://localhost:3000/admin
   - Login dengan kredensial admin

3. **Test Paket Tiba:**
   - Pergi ke Admin > Packages
   - Create paket baru untuk customer
   - Customer akan menerima WA dengan template:
     > "HI {name}, Paket anda {resi} sudah dapat diambil di Pickpoint {location}. Untuk detail informasi dapat membuka link berikut {link}"

4. **Test Membership Success:**
   - Customer beli membership
   - Bayar via Midtrans (gunakan sandbox)
   - Setelah pembayaran sukses, customer terima WA:
     > "Halo {name}, pembayaran membership anda berhasil! Masa aktif member anda telah diperpanjang hingga {expiryDate}. Terima kasih!"

5. **Test Membership Reminder:**
   - Pergi ke Admin > Customers
   - Cari customer yang sudah member
   - Klik tombol 🔔 "Kirim Pengingat"
   - Customer terima WA:
     > "Halo {name}, masa aktif membership anda akan segera berakhir pada {expiryDate}. Segera lakukan perpanjangan untuk tetap menikmati layanan kami."

## Troubleshooting

### ❌ "WhatsApp API not configured"
- Cek file `.env.local` sudah ada dan benar
- Restart dev server setelah edit `.env.local`

### ❌ "WhatsApp API error: 401"
- API Key salah atau expired
- Cek dashboard provider WhatsApp Gateway

### ❌ "WhatsApp API error: 400"
- Format nomor HP salah (harus 628xxx tanpa +)
- Cek format body request sesuai provider

### ✅ Success tapi tidak terima WA
- Cek nomor HP sudah benar
- Cek quota/saldo di dashboard provider
- Cek nomor sender sudah terverifikasi

## Template Notifikasi

### 1. Package Arrival
```
HI {name}, Paket anda {resi} sudah dapat diambil di Pickpoint {location}. Untuk detail informasi dapat membuka link berikut {link}
```

### 2. Membership Success
```
Halo {name}, pembayaran membership anda berhasil! Masa aktif member anda telah diperpanjang hingga {expiryDate}. Terima kasih!
```

### 3. Membership Reminder
```
Halo {name}, masa aktif membership anda akan segera berakhir pada {expiryDate}. Segera lakukan perpanjangan untuk tetap menikmati layanan kami.
```

## Next Steps

Setelah test berhasil:
1. ✅ Update template di Admin > Settings (opsional)
2. ✅ Setup webhook Midtrans untuk production
3. ✅ Test end-to-end flow dengan customer real
4. ✅ Monitor logs untuk error handling
