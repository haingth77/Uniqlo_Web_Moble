# UNIQLO Mobile Automation (Android · Appium · WebdriverIO · TypeScript)

Bộ khung test native app UNIQLO trên Android. Tách biệt hoàn toàn với framework
Playwright (web) ở thư mục gốc — có `package.json` riêng.

## Yêu cầu môi trường

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Node.js | ✅ có (v24) | |
| Java JDK 17 | ✅ có | Appium cần JAVA_HOME |
| Appium 2.x | ✅ có (2.13.1) | |
| Android SDK + `adb` | ❌ **chưa có** | cài qua Android Studio |
| driver `uiautomator2` | ❌ chưa cài | `npm run driver:install` |
| Android Emulator | ❌ chưa có | tạo trong Android Studio |
| File `uniqlo.apk` | ❌ chưa có | xem mục "Lấy APK" |

> ⚠️ **WSL2:** Android emulator không chạy tốt trong WSL2. Cách khuyến nghị:
> chạy **Android Studio + Emulator + Appium trên Windows host**, hoặc chạy
> emulator trên Windows rồi kết nối từ WSL bằng `adb connect <IP-Windows>:5555`.

## Cài đặt

```bash
cd mobile
npm install                 # cài webdriverio + appium deps
npm run driver:install      # cài driver uiautomator2
npm run appium:doctor       # kiểm tra ANDROID_HOME, adb, java... đã ok chưa
```

Đặt biến môi trường (Windows PowerShell hoặc ~/.bashrc):

```bash
export ANDROID_HOME=$HOME/Android/Sdk         # hoặc đường dẫn SDK của bạn
export PATH=$PATH:$ANDROID_HOME/platform-tools # để có adb
export PATH=$PATH:$ANDROID_HOME/emulator
```

## Lấy APK và thông tin app

1. **Lấy .apk**: cài app UNIQLO từ CH Play lên emulator/máy thật, rồi kéo ra:
   ```bash
   adb shell pm list packages | grep -i uniqlo      # tìm package name
   adb shell pm path <package_name>                 # ra đường dẫn base.apk
   adb pull <đường/dẫn/base.apk> ./apps/uniqlo.apk
   ```
2. **Lấy appActivity** (nếu dùng app đã cài thay vì .apk):
   ```bash
   adb shell dumpsys package <package> | grep -A1 "MAIN"
   ```
3. Điền `APP_PACKAGE` / `APP_ACTIVITY` trong `wdio.conf.ts`, hoặc để `apps/uniqlo.apk`.

## Chạy test

```bash
# 1) Khởi động emulator (trên Windows) — ví dụ:
emulator -avd Pixel_6_API_34

# 2) Kiểm tra thiết bị đã kết nối
adb devices

# 3) Chạy test (Appium server tự khởi động qua @wdio/appium-service)
npm test
```

## Tìm selector thật bằng Appium Inspector

Các selector trong `test/screens/*.ts` là **placeholder**. App bên thứ ba
thường không có accessibility id sạch nên phải lấy selector thật:

1. Cài **Appium Inspector** (https://github.com/appium/appium-inspector).
2. Start Appium server: `npm run appium`.
3. Trong Inspector, nhập capabilities y như trong `wdio.conf.ts`, Start Session.
4. Click vào element trên cây UI → copy `resource-id` / `content-desc` / `text`.
5. Cập nhật lại selector trong `home.screen.ts`.

Chiến lược selector cho native Android (ưu tiên từ trên xuống):
- `~accessibilityId` (content-desc) — ổn định nhất.
- `resource-id` qua `android=new UiSelector().resourceId("...")`.
- text / textContains — dễ gãy khi đổi ngôn ngữ, chỉ dùng khi hết cách.

## Cấu trúc

```
mobile/
├─ wdio.conf.ts            # cấu hình + capabilities Android
├─ apps/uniqlo.apk         # (bạn tự thêm)
├─ test/
│  ├─ screens/             # Page Object cho từng màn hình
│  │   ├─ base.screen.ts
│  │   └─ home.screen.ts
│  └─ specs/               # test case
│      └─ home.e2e.ts
```

## Bước tiếp theo gợi ý
- [ ] Cài Android Studio + tạo emulator, kết nối `adb devices` thấy device.
- [ ] Lấy `uniqlo.apk` + package/activity.
- [ ] Chạy `npm test` để xác nhận app mở được (test `Home` đầu tiên).
- [ ] Dùng Appium Inspector cập nhật selector thật.
- [ ] Bật lại test `tìm kiếm sản phẩm` (đang `.skip`).
- [ ] Sau khi Android ổn → mở rộng iOS (cần Mac).
