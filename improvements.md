1. Ingestion Portal: Drag-and-Drop CSV & SQLite/Postgres Persistence (Estimasi: 2 Hari)
   Kondisi Sekarang: Data realtime_rig_telemetry.csv dan daily_drilling_reports.csv masih berformat static file di folder public/data/. Jika ada data sumur baru, developer harus meletakkan file secara manual.
   Yang Dikerjakan dalam 1 Minggu:
   Membuat halaman/modal upload file drag-and-drop sederhana.
   Validasi schema menggunakan zod atau papaparse (memastikan kolom dtsrv, DEPTH, WOB, HKLD, TORQUE ada dan formatnya valid).
   Menyimpan ke database relasional ringan (PostgreSQL/Supabase atau SQLite via Prisma/Drizzle).
   Nilai Bisnis untuk Rig Team: Engineer lapangan bisa langsung mengunggah file data sumur mereka sendiri hari itu juga tanpa perlu bantuan tim IT/developer.

2. Configurable Threshold & Formation Presets UI (Estimasi: 1.5 Hari)
   Kondisi Sekarang: Parameter pendeteksi anomali masih hardcoded di kode (misalnya: ambang batas stick-slip di TORQUE_stddev > 800 ft-lbf dan WOB > 5 klbf).
   Yang Dikerjakan dalam 1 Minggu:
   Membuat panel drawer "Detection Settings" di dashboard dengan slider input untuk mengatur threshold WOB, Torsi, dan Flow.
   Fitur Presets per formasi/trayek (misal: Preset "Trayek 12-1/4 inch Formasi Telisa" vs "Trayek 8-1/2 inch Formasi Duri/Minas").
   Nilai setting disimpan di localStorage atau profil user.
   Nilai Bisnis untuk Rig Team: Formasi batuan di WK Rokan memiliki karakteristik yang berbeda-beda. Tool ini memberi fleksibilitas bagi Drilling Engineer untuk menaikkan/menurunkan sensitivitas alarm tanpa menyentuh kode program.

3. Automated 1-Click "Shift Handover Summary" PDF Export (Estimasi: 1.5 Hari)
   Kondisi Sekarang: Dashboard menampilkan grafik dan kalkulator state, tetapi belum ada cara cepat untuk mendistribusikan ringkasan temuan ke tim lapangan lain.
   Yang Dikerjakan dalam 1 Minggu:
   Tombol "Export Handover Report" yang mengompilasi data 12 jam shift terakhir menggunakan @react-pdf/renderer atau html2canvas + jspdf.
   Output PDF 1 halaman berisi:
   Pie chart persentase waktu operasi (Drilling vs Tripping vs Connection).
   Daftar kejadian anomali stick-slip beserta stempel waktunya.
   Ringkasan catatan DDR terbaru dari asisten AI.
   Nilai Bisnis untuk Rig Team: Setiap pergantian shift (pukul 06:00 / 18:00), Company Man di rig menghabiskan 30–45 menit mengetik laporan serah terima. Fitur ini memotong proses tersebut menjadi hitungan detik.
