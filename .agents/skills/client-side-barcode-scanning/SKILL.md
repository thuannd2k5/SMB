---
name: client-side-barcode-scanning
description: >-
  Use this skill whenever implementing, configuring, or debugging the camera-based barcode scanning feature
  on the React PWA frontend using html5-qrcode. It guides low-latency client-side scanning, camera permissions,
  viewport boundaries, and barcode format validation (EAN-13, UPC, Code-128).
---

# Client-Side Barcode Scanning Guide for React PWA

## Overview
Tính năng quét mã vạch hoạt động trực tiếp trên trình duyệt của điện thoại (Client-Side) qua thư viện `html5-qrcode`. Quá trình giải mã mã vạch (decode) diễn ra ngay trên CPU của thiết bị với thời gian phản hồi < 200ms. Chỉ chuỗi số barcode (text) được gửi lên backend, không gửi luồng video giúp giảm 99% chi phí băng thông mạng.

## Cấu hình chuẩn cho `html5-qrcode`

```jsx
import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.QR_CODE,
];

export function useBarcodeScanner({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scannerId = "interactive-barcode-viewport";
    const html5QrCode = new Html5Qrcode(scannerId, {
      formatsToSupport: SUPPORTED_FORMATS,
      verbose: false
    });
    scannerRef.current = html5QrCode;

    const qrConfig = {
      fps: 15, // 15 fps là điểm cân bằng giữa mượt mà và tiết kiệm pin thiết bị
      qrbox: { width: 260, height: 180 }, // Khung chữ nhật chuẩn cho mã vạch gia dụng (EAN-13)
      aspectRatio: 1.0,
    };

    html5QrCode.start(
      { facingMode: "environment" }, // Luôn ưu tiên Camera sau
      qrConfig,
      (decodedText, decodedResult) => {
        // Tạm dừng scanner hoặc throttle để tránh quét trùng lặp trong 1 giây
        if (navigator.vibrate) navigator.vibrate(100); // Rung nhẹ phản hồi xúc giác
        onScanSuccess(decodedText.trim());
      },
      (errorMessage) => {
        // Không spam log khi đang tìm khung quét
      }
    ).catch(err => {
      console.error("Camera access error:", err);
      if (onScanError) onScanError(err);
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);
}
```

## Các nguyên tắc trải nghiệm người dùng (UX Guidelines):
1. **Âm thanh và Rung (Audio/Haptic feedback)**: Khi đọc được mã vạch thành công, kích hoạt `navigator.vibrate(100)` và phát 1 âm beep ngắn ("bíp") để người dùng biết máy đã nhận diện.
2. **Khung quét trực quan**: Vẽ đường kẻ laser màu xanh lá hoặc đỏ chạy quét lên xuống trong khung chữ nhật (`qrbox`) để chỉ dẫn người dùng đưa mã vạch vào đúng vị trí.
3. **Bật tắt đèn Flash (Torch)**: Cung cấp nút bật đèn Flash nếu thiết bị hỗ trợ (`scannerRef.current.applyVideoConstraints({ advanced: [{ torch: true }] })`) để quét trong kho tối.
4. **Hỗ trợ nhập tay (Manual Entry Fallback)**: Luôn để 1 ô input "Hoặc nhập mã số vạch bằng tay" bên dưới camera cho trường hợp tem mã vạch bị rách, xước mờ.
