# Integrasi Eksternal - Setup Guide

## 1. Web Push Notifications (VAPID)

### Setup
Sudah dikonfigurasi di `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:noreply@pickpoint.my.id"
```

### Fitur
- ✅ Notifikasi saat paket tiba
- ✅ Notifikasi pembayaran berhasil
- Otomatis terkirim saat:
  - Drop-off paket berhasil
  - Pembayaran settlement dari Midtrans

### Files
- `src/lib/webpush.ts` - Service untuk mengirim notifikasi
- `src/app/api/packages/create/route.ts` - Trigger notifikasi paket tiba

---

## 2. Midtrans Payment Gateway

### Setup di `.env.local`
Tambahkan kredensial Midtrans:
```env                                                                                                                                                               
MIDTRANS_SERVER_KEY="your-midtrans-server-key-here"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key-here"
MIDTRANS_IS_PRODUCTION="false"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="your-midtrans-client-key-here"
```

### Cara Mendapatkan Keys
1. Daftar di [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Pilih Environment (Sandbox/Production)
3. Copy Server Key & Client Key dari Settings → Access Keys

### Endpoints

#### Generate Payment Token
```
POST /api/midtrans/token
Body: { "transactionId": "txn-123" }
Response: { "token": "snap-token-xxx", "orderId": "txn-123" }
```

#### Webhook Handler
```
POST /api/midtrans/webhook
```
Daftar URL ini di Midtrans Dashboard:
- Settings → Configuration → Payment Notification URL
- URL: `https://pickpoint.my.id/api/midtrans/webhook`

### Fitur
- ✅ Generate Snap token untuk pembayaran
- ✅ Verifikasi signature webhook
- ✅ Auto-update status transaksi
- ✅ Update paket status saat bayar
- ✅ Extend membership saat bayar
- ✅ Kirim notifikasi pembayaran berhasil

### Files
- `src/lib/midtrans.ts` - Midtrans client & helpers
- `src/app/api/midtrans/token/route.ts` - Generate token
- `src/app/api/midtrans/webhook/route.ts` - Handle payment notifications

---

## 3. WhatsApp Gateway

### Setup di `.env.local`
```env
WHATSAPP_API_URL="https://api.whatsapp.com/send"
WHATSAPP_API_KEY="your-whatsapp-api-key"
```

### Provider WhatsApp Gateway
Pilih salah satu:
- [Fonnte](https://fonnte.com)
- [WooWA](https://woowa.id)
- [Wablas](https://wablas.com)
- [WAHA (WhatsApp HTTP API)](https://waha.devlike.pro)

### Fitur
- ✅ Notifikasi paket tiba via WA
- ✅ Notifikasi pembayaran berhasil
- ✅ Format nomor otomatis (62xxx)
- Opsional - jika tidak dikonfigurasi, sistem tetap jalan dengan push notification

### Files
- `src/lib/whatsapp.ts` - WhatsApp gateway service

---

## Testing

### 1. Test Web Push Notifications
1. Buka app di browser (HTTPS required)
2. Allow notifications saat diminta
3. Drop paket baru
4. Cek notifikasi browser

### 2. Test Midtrans (Sandbox)
1. Set `MIDTRANS_IS_PRODUCTION="false"`
2. Gunakan test cards dari [Midtrans Docs](https://docs.midtrans.com/docs/testing-payment)
3. Create transaction
4. Bayar dengan test card
5. Cek webhook logs

### 3. Test WhatsApp
1. Konfigurasi gateway provider
2. Drop paket baru
3. Cek WA nomor penerima

---

## Production Checklist

- [ ] Generate VAPID keys baru untuk production
- [ ] Daftar Midtrans Production account
- [ ] Update Midtrans keys ke Production
- [ ] Set `MIDTRANS_IS_PRODUCTION="true"`
- [ ] Daftar webhook URL di Midtrans Dashboard
- [ ] Setup WhatsApp gateway account (opsional)
- [ ] Test end-to-end flow
- [ ] Monitor webhook logs

---

## Security Notes

1. **VAPID Keys**: Jangan commit private key ke Git
2. **Midtrans Server Key**: Simpan aman, jangan expose ke client
3. **Webhook Signature**: Selalu validasi signature Midtrans
4. **HTTPS**: Wajib untuk production (web push & payment)

---

## Troubleshooting

### Push Notification Tidak Terkirim
- Pastikan user sudah subscribe (pushSubscription ada di database)
- Cek VAPID keys benar
- Browser harus HTTPS (localhost ok untuk dev)

### Midtrans Webhook Tidak Diterima
- Cek URL webhook di Midtrans Dashboard
- Pastikan server bisa diakses public
- Cek logs di `/api/midtrans/webhook`
- Validasi signature key benar

### WhatsApp Tidak Terkirim
- Cek konfigurasi gateway provider
- Validasi format nomor HP (harus 62xxx)
- Cek API key & URL benar
- Lihat response error dari provider
