# Locator · Action · Assert — Cheat-sheet + Flashcards ôn phỏng vấn

> Dành cho ôn UI automation (Playwright + TS). Mọi ví dụ neo vào code thật trong repo:
> `src/pages/home.page.ts`, `src/pages/item.list.page.ts`.
> Vì nền tảng của bạn là API testing, phần **actions** và **web-first assertions** là chỗ cần luyện phản xạ nhất.

---

# PHẦN A — CHEAT-SHEET

## 1. LOCATOR — tìm phần tử

### 1a. User-facing locators (ưu tiên #1)
Thứ tự ưu tiên chuẩn Playwright: **role → label → placeholder → text → altText → title → testId → CSS/XPath**.

| Locator | Dùng khi | Ví dụ repo | Note |
|---|---|---|---|
| `getByRole` | Mặc định cho element tương tác | `getByRole('tab', { name: 'men', exact: true })` — home.page.ts:10 | **Target:** mọi element có ARIA role (form + non-form). **Action:** `textbox/checkbox/combobox` → `fill/check/selectOption`; `button/tab/link` → `click`. **Assert:** `heading` → `toHaveText`; `tab` → `toHaveAttribute('aria-selected')`; dùng `name` (= accessible name, text con visible vẫn tính). Option theo role: `level`, `selected`, `checked`, `expanded`. |
| `getByLabel` | Input trong form có `<label>` | `getByLabel('Password')` | **Target:** chỉ **form control** (input/textarea/select/checkbox/radio) — luôn trỏ field, **không** trỏ `<label>`. **Action:** `fill`, `check`, `selectOption`. **Assert:** `toHaveValue`, `toBeChecked`. Muốn assert text trên label → dùng `getByText`. |
| `getByPlaceholder` | Input chưa có label / id | `getByPlaceholder('Search users')` | **Target:** chỉ **form control** có `placeholder`. **Action:** `fill`, `clear`. **Assert:** `toHaveValue`. Fallback khi không có label; `placeholder` không phải accessible name. |
| `getByText` | Bám text hiển thị trên DOM | `getByText(/^\$\s?[\d,]+\.\d{2}$/)` — item.list.page.ts:71 | **Target:** bất kỳ element có **text DOM** (span, p, label, div…). **Assert (chính):** `toBeVisible`, `toHaveText`, `toContainText` — giá, message, label text. **Action:** `click` được nhưng ít semantic; không dùng thay `getByLabel` khi muốn nhập input. Không phải accessible name. |
| `getByAltText` | `<img>` / image | `getByAltText('Company Logo')` | **Target:** image (`alt` = accessible name). **Action:** `click` (logo, icon ảnh). **Assert:** `toBeVisible`. Tương đương `getByRole('img', { name })`. |
| `getByTitle` | Element có `title` attr | `getByTitle('Close')` | **Target:** element bất kỳ có `title` (thường icon-only button, tooltip). **Action:** `click`. **Assert:** `toBeVisible`. Kém ổn định hơn `getByRole` + `aria-label`. |
| `getByTestId` | UI hay đổi text/DOM | `getByTestId('login-submit')` | **Target:** bất kỳ element có `data-testid`. **Action + Assert:** đều được (`click`, `toBeVisible`…). Không semantic / không theo a11y — fallback cuối khi role/label/text không đủ. |

**Phân loại nhanh — Target · Action · Assert**

| Nhóm | Locator | Target | Action hay Assert? |
|---|---|---|---|
| **Chỉ form control** | `getByLabel`, `getByPlaceholder` | input, textarea, select, checkbox… | **Action** chính: `fill`, `check`, `selectOption` |
| **Form + non-form** | `getByRole` | tùy role truyền vào | **Action:** button/tab/link/textbox… · **Assert:** heading, tab state, text |
| **Text DOM** | `getByText` | span, p, label, price… | **Assert** chính: `toBeVisible`, `toHaveText` |
| **Image** | `getByAltText` | `<img>` | Action + assert |
| **Theo attribute** | `getByTitle`, `getByTestId` | icon button, container… | Action + assert (fallback) |

**Vì sao ưu tiên `getByRole`?** Test theo góc nhìn người dùng + accessibility; bền khi class/DOM đổi; fail sớm nếu a11y hỏng.

### 1b. CSS / XPath (khi user-facing không đủ)
```ts
page.locator('#homeCategoryList')            // CSS id — home.page.ts:28
page.locator('label[for="size-m"]')          // CSS attribute — item.list.page.ts:261
page.locator('xpath=//button[text()="OK"]')  // XPath — tránh nếu được
```

### 1c. Lọc & thu hẹp (chỗ dễ yếu — dùng nhiều khi UI thật lộn xộn)
```ts
locator.filter({ hasText: 'Sale' })            // lọc theo text con
locator.filter({ has: page.getByRole(...) })   // lọc theo element con — item.list.page.ts:102
locator.filter({ visible: true })              // chỉ element hiển thị — :73
parent.getByRole('link')                       // scoping: tìm bên trong cha — :63
locator.and(other)   locator.or(other)         // giao / hoặc
```

### 1d. Chọn theo vị trí (khi nhiều match)
```ts
locator.first()      // :73        locator.last()
locator.nth(2)       // :366       locator.count()  // :205, :293
```

> **Strict mode:** action/assert dạng single sẽ báo lỗi nếu locator khớp >1 element. Thu hẹp bằng `.first()` / `.filter()` / scoping (như `resultsCountVisible` — :76).

---

## 2. ACTIONS — tương tác
Mọi action có **auto-waiting** (chờ element actionable: visible + enabled + stable). Khác biệt lớn với Selenium.

### 2a. Click & chuột
```ts
await locator.click()                     // :156
await locator.click({ force: true })      // bỏ qua actionability — :264
await locator.dblclick()
await locator.hover()
await locator.scrollIntoViewIfNeeded()    // :194, :280
await page.mouse.wheel(0, 4000)           // cuộn — :298
```

### 2b. Nhập liệu
```ts
await locator.fill('text')            // set value — khuyên dùng
await locator.clear()
await locator.pressSequentially('ab') // gõ từng phím (trigger keydown/up)
await locator.press('Enter')
await page.keyboard.press('Escape')   // :162
```

### 2c. Form controls
```ts
await locator.check() / .uncheck()
await locator.setChecked(true)
await locator.selectOption('value')   // <select> native
await locator.setInputFiles('a.pdf')  // upload
```

### 2d. Waiting
```ts
await locator.waitFor({ state: 'visible' })       // attached|visible|hidden|detached — :157,:229
await page.waitForLoadState('domcontentloaded')   // :218
await page.waitForURL(/checkout/)
await page.waitForResponse(r => r.url().includes('/api'))  // liên kết sở trường API!
// await page.waitForTimeout(2500)  // hard wait — CHỈ khi bất đắc dĩ — :149
```

### 2e. Đọc dữ liệu (để assert)
```ts
await locator.innerText() / .textContent()  // :287
await locator.inputValue()
await locator.getAttribute('href')          // :259, :348
await locator.boundingBox()                 // vị trí/kích thước — :366
await locator.allInnerTexts()               // mảng text — :310
await locator.evaluateAll(els => ...)       // chạy JS trên mọi match — :349
```

---

## 3. ASSERTIONS

### 3a. Web-first (`expect(locator)`) — AUTO-RETRY, không await thủ công giá trị
```ts
// Trạng thái
await expect(locator).toBeVisible()   / .toBeHidden()
await expect(locator).toBeEnabled()   / .toBeDisabled()
await expect(locator).toBeChecked()
await expect(locator).toBeEditable()  / .toBeFocused() / .toBeEmpty()

// Nội dung
await expect(locator).toHaveText('exact')      // hoặc mảng
await expect(locator).toContainText('partial')
await expect(locator).toHaveValue('abc')
await expect(locator).toHaveAttribute('href', /.../)
await expect(locator).toHaveClass(/active/)
await expect(locator).toHaveCount(5)

// Trang
await expect(page).toHaveURL(/checkout/)
await expect(page).toHaveTitle('Cart')
```

### 3b. Non-retrying (giá trị JS thường — giống assert API bạn quen)
```ts
expect(prices).toEqual([...])
expect(count).toBeGreaterThan(0)
expect(name).toBe('Men')
expect(arr).toHaveLength(3)
```

### 3c. Visual / snapshot (repo đã có item.list.visual.spec.ts)
```ts
await expect(locator).toHaveScreenshot('price.png')
await expect(page).toHaveScreenshot()
expect(data).toMatchSnapshot('x.json')
```

**Cả hai `toHaveScreenshot` đều assert cùng một thứ:** chụp screenshot hiện tại → so pixel với **baseline `.png`** trong folder `*-snapshots/` → khớp pass, lệch fail (kèm diff image). Không phải hai loại assert khác nhau.

| Assert | Chụp gì | Tên baseline | Ghi chú |
|---|---|---|---|
| `expect(locator).toHaveScreenshot('price.png')` | **Chỉ element** (vd: ô giá) | Bạn đặt: `price.png` | Ít flaky; dùng khi chỉ cần verify 1 vùng UI. Repo: `first-product-price.png` — item.list.visual.spec.ts |
| `expect(page).toHaveScreenshot()` | **Cả trang** (full viewport) | Playwright **tự sinh** từ test title + project + OS | Dễ flaky (banner, cookie, font khác OS). Vẫn so pixel với baseline — không phải “chỉ chụp không so”. |
| `expect(data).toMatchSnapshot('x.json')` | **Dữ liệu** (JSON/text), không phải ảnh | `x.json` trong `*-snapshots/` | API response, parsed data — cơ chế baseline tương tự screenshot. |

**Vòng đời baseline (screenshot & snapshot):**

| Tình huống | Local | CI (`CI=true`) |
|---|---|---|
| Chưa có baseline | Tạo file mới → test **pass** | **Fail** — phải commit snapshot vào repo |
| Có baseline, UI/data giống | Pass | Pass |
| Có baseline, khác pixel/data | Fail + diff | Fail + diff |
| Cố ý cập nhật baseline | `npx playwright test --update-snapshots` | Generate trong Docker/Linux rồi commit (font/OS khác → baseline WSL có thể fail trên CI) |

**Option hay dùng:** `maxDiffPixels`, `threshold` — nới tolerance antialiasing giữa các máy (repo dùng `maxDiffPixels: 50`).

**Khi nào dùng cái nào:**
- Element nhỏ, ổn định → `locator.toHaveScreenshot('ten-ro.png')` ✅
- Layout cả trang → `page.toHaveScreenshot()` — cân nhắc flaky
- Nhiều snapshot trong 1 file test → **đặt tên rõ**; không đặt tên thì auto-name theo test title (OK nếu 1 test = 1 snapshot)

### 3d. Soft assertions (chạy tiếp dù fail)
```ts
await expect.soft(locator).toBeVisible()
```

> **Ranh giới người biết thật vs học vẹt:**
> `await expect(locator).toBeVisible()` → auto-retry đến khi visible (chống flaky).
> `expect(await locator.isVisible()).toBe(true)` → chụp giá trị 1 lần → dễ flaky.

---

## 4. LAZY LOADING / INFINITE SCROLL (case Uniqlo)

Trang product Uniqlo: load X sản phẩm đầu → scroll tới đáy → fetch batch tiếp → **append vào DOM** → lặp tới hết. Đây là **infinite scroll (case B)**.

### 4a. 3 cơ chế "element chưa hiện" — locate được hay không?

| Cơ chế | Element có trong DOM lúc ở đầu trang? | Locate từ đầu trang? | `scrollIntoViewIfNeeded()` cứu được? |
|---|---|---|---|
| **A. Off-screen** (trang dài thường) | ✅ Có, chỉ nằm dưới fold | ✅ Được (action/assert tự auto-scroll) | ✅ Có |
| **B. Lazy-load / infinite scroll** (append khi scroll) — *Uniqlo* | ❌ Chưa fetch thì chưa có | ❌ `count()` = 0, assert timeout | ❌ Không (không có gì để scroll tới) |
| **C. Virtualization** (react-window: chỉ render vùng nhìn) | ❌ Ra ngoài vùng bị gỡ khỏi DOM | ❌ Phải scroll để render lại | ❌ Không |

**Phân biệt A vs B/C:** ở đầu trang chạy `await locator.count()`. Ra **tổng số** sản phẩm → case A (off-screen). Ra **số đang hiển thị** (nhỏ hơn tổng) → case B/C (lazy).

> **Bẫy vàng:** `scrollIntoViewIfNeeded()` chỉ giúp case A. Với B/C element chưa có trong DOM nên không scroll tới được — phải **trigger việc load** (cuộn) mới có element.

### 4b. Test sản phẩm ở giữa / gần cuối — chọn theo mục tiêu

```ts
// Cách 1 — Scroll tải HẾT rồi thao tác (khi cần assert toàn bộ, vd sort đúng từ đầu tới cuối)
async scrollToLoadAll(maxSteps = 40) {           // item.list.page.ts:291-301
  let prev = -1;
  for (let i = 0; i < maxSteps; i++) {
    const cur = await this.productList.getByRole('link').count();
    if (cur === prev) break;                     // số card ngừng tăng = đã hết
    prev = cur;
    await this._page.mouse.wheel(0, 4000);
    await this._page.waitForTimeout(500);        // chờ batch append
  }
}

// Cách 2 — Scroll tới KHI target xuất hiện (nhanh hơn, không tải hết)
const target = productList.getByText('Áo thun ABC');
for (let i = 0; i < 40 && (await target.count()) === 0; i++) {
  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(500);
}
await target.scrollIntoViewIfNeeded();
await expect(target).toBeVisible();

// Cách 3 — BỎ QUA UI: dùng API / URL để đưa target vào tầm với (ổn định nhất)
// - Chỉ verify DATA  → gọi thẳng products API với offset/limit, khỏi scroll
// - Verify hiển thị  → sort/filter/URL để đẩy target lên đầu grid (vd sản phẩm rẻ nhất → sort Low→High)
```

**Nguyên tắc senior:** chỉ scroll khi test **chính hành vi UI** (lazy render, layout, thứ tự khi cuộn). Nếu chỉ cần **verify data** → dùng API/URL, đừng cuộn nghìn card (chậm + flaky). Luôn có **điều kiện dừng** (count ngừng tăng / target xuất hiện), không scroll số lần cố định.

### 4c. Footer (case A) — KHÔNG cần scroll để locate

Footer thường là **markup tĩnh render sẵn trong DOM** ngay từ đầu (không phải data phải fetch) → **case A**. Playwright locate + assert được ngay dù đang ở đầu trang:

```ts
const footer = page.getByRole('contentinfo');   // hoặc page.locator('footer')

await footer.count();                    // → 1  (đã attached trong DOM)
await expect(footer).toBeVisible();      // ✅ PASS ngay, KHÔNG cần scroll!
await footer.getByRole('link', { name: 'Privacy' }).click();  // action tự auto-scroll rồi click
```

**Điểm mấu chốt: "ngoài viewport" ≠ "không visible" (bẫy Selenium → Playwright).**
Định nghĩa **visible** của Playwright: element **không** bị `display:none` / `visibility:hidden` **và** có bounding box (w,h > 0). **Không** xét element có nằm trong viewport hay không → footer dưới đáy trang vẫn được coi là *visible*.

| Thao tác | Cần scroll trước? |
|---|---|
| `footer.count()`, `getAttribute`, `textContent` | ❌ Chỉ cần có trong DOM |
| `expect(footer).toBeVisible()` | ❌ Off-screen vẫn tính visible |
| `footer.click()` / `.hover()` | ❌ Action tự auto-scroll (actionability) |
| `scrollIntoViewIfNeeded()` | Không bắt buộc, nhưng dùng được (case A) |

**Footer (case A) vs sản phẩm cuối grid (case B — infinite scroll):**

| | Footer | Sản phẩm cuối grid |
|---|---|---|
| Trong DOM từ đầu? | ✅ Có (markup tĩnh) | ❌ Chưa fetch → chưa có |
| `count()` ở đầu trang | 1 | 0 |
| `toBeVisible()` không scroll | ✅ Pass | ❌ Timeout |
| `scrollIntoViewIfNeeded()` cứu được? | ✅ | ❌ (không có gì để scroll tới) |

> **Edge case thực tế:** trên trang infinite-scroll, footer *có* trong DOM nhưng bạn có thể **không bao giờ cuộn tới bằng mắt** — cứ gần đáy là grid nạp thêm sản phẩm đẩy footer xuống. Nhưng điều đó chỉ cản việc *nhìn thấy*, không cản việc *locate/assert* (nó đã ở trong DOM).
>
> **Câu trả lời "senior":** locate được hay không phụ thuộc element có trong **DOM** chưa, KHÔNG phụ thuộc nó có trong **viewport** chưa.

## 5. ASSERT THỨ TỰ SẮP XẾP (sort low → high)

Đọc giá ra **mảng số** → kiểm mảng đã tăng dần chưa. Với Low→High, sản phẩm rẻ nhất ở đầu grid nên **không cần scroll** nếu chỉ lấy 10 cái đầu.

```ts
const prices = await itemList.getProductPrices(10);   // parse "$12.90" → 12.9, theo DOM order — :308

// Cách A — so với chính nó đã sort
const sorted = [...prices].sort((a, b) => a - b);      // BẮT BUỘC comparator (a,b)=>a-b
expect(prices).toEqual(sorted);

// Cách B — kiểm từng cặp (báo lỗi rõ chỗ sai)
for (let i = 0; i < prices.length - 1; i++) {
  expect(prices[i], `Giá[${i}]=${prices[i]} phải <= Giá[${i + 1}]`).toBeLessThanOrEqual(prices[i + 1]);
}
```

**3 bẫy phải nhớ:**
1. `.sort()` mặc định sắp theo **chuỗi** → `[10,2,100].sort()` = `[10,100,2]`. Phải `(a,b)=>a-b`.
2. So trên **số, không phải chuỗi** — `"$100" < "$20"` theo string là `true` (sai). Vì vậy parse ra `number` trước.
3. Dùng **`<=` không phải `<`** — trang bán hàng hay có sản phẩm cùng giá, `<` fail oan.

> Đây là **non-retrying assertion** (đọc giá trị 1 lần). Trước khi đọc phải chắc grid đã cập nhật sau sort (chờ `PRODUCTS_API` hoặc `waitForGrid`), nếu không đọc nhầm giá của lần sort cũ.

---

# PHẦN B — FLASHCARDS (tự luyện phản xạ)

> Cách dùng: che phần **Đáp án**, đọc HTML/đề, tự viết locator + action + assert, rồi so.

### FC-01
**HTML:** `<button type="submit">Đăng nhập</button>`
Viết locator + click + assert nút bật.
<details><summary>Đáp án</summary>

```ts
const btn = page.getByRole('button', { name: 'Đăng nhập' });
await expect(btn).toBeEnabled();
await btn.click();
```
</details>

### FC-02
**HTML:** `<input aria-label="Email" placeholder="you@mail.com">`
Nhập email và verify giá trị.
<details><summary>Đáp án</summary>

```ts
const email = page.getByLabel('Email');            // hoặc getByPlaceholder('you@mail.com')
await email.fill('a@b.com');
await expect(email).toHaveValue('a@b.com');
```
</details>

### FC-03
**Tình huống:** Có 5 sản phẩm text giá `$x.xx`, nhiều bản bị ẩn. Lấy giá đầu tiên **đang hiển thị**.
<details><summary>Đáp án</summary>

```ts
const price = page.getByText(/^\$\s?[\d,]+\.\d{2}$/).filter({ visible: true }).first();
await expect(price).toBeVisible();
// Chính là item.list.page.ts:70-73
```
</details>

### FC-04
**Tình huống:** Dropdown sort render `role="listbox"` **chỉ khi mở**; trang còn 1 `<select>` cũng có `role="option"`. Chọn "Price: Low to high" an toàn.
<details><summary>Đáp án</summary>

```ts
await page.getByRole('button', { name: 'Sort by' }).click();
const listbox = page.getByRole('listbox');
await listbox.waitFor({ state: 'visible' });
await listbox.getByRole('option', { name: 'Price: Low to high', exact: true }).click();
// Scope option TRONG listbox để không dính option của <select> — item.list.page.ts:90-95,167
```
</details>

### FC-05
**Tình huống:** Chạy `getByRole('button')` báo lỗi *strict mode violation: resolved to 3 elements*. Xử lý?
<details><summary>Đáp án</summary>

Thu hẹp: thêm `{ name: '...' }`, hoặc `.filter({ hasText })`, hoặc scope trong cha, hoặc `.first()/.nth()`. Không được để 1 locator khớp nhiều element khi gọi action/assert single.
</details>

### FC-06
**HTML:** checkbox bị ẩn, label hiển thị: `<input id="s-m" type="checkbox"><label for="s-m">M</label>`
Tick size M khi native checkbox bị ẩn.
<details><summary>Đáp án</summary>

```ts
const id = await page.getByRole('checkbox', { name: /^M( M)?$/ }).getAttribute('id');
await page.locator(`label[for="${id}"]`).click();   // click label vì input bị ẩn
// item.list.page.ts:257-265
```
</details>

### FC-07
**Tình huống:** Sau khi click Sort, muốn chắc grid đã cập nhật rồi mới đọc giá. SPA không bao giờ đạt `networkidle`.
<details><summary>Đáp án</summary>

```ts
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(2500);   // grace period vì SPA không networkidle
// item.list.page.ts:149-152 — hard wait chỉ dùng khi không có tín hiệu tốt hơn
```
</details>

### FC-08
**Tình huống:** Verify URL sau khi lọc chứa `sort=2`.
<details><summary>Đáp án</summary>

```ts
await expect(page).toHaveURL(/sort=2/);
// hoặc: expect(new URL(page.url()).searchParams.get('sort')).toBe('2');  // item.list.page.ts:141
```
</details>

### FC-09
**Tình huống:** Lấy tất cả giá trong grid rồi assert đã sort tăng dần.
<details><summary>Đáp án</summary>

```ts
const prices = await itemList.getProductPrices();     // dùng allInnerTexts() bên trong — :310
const sorted = [...prices].sort((a, b) => a - b);
expect(prices).toEqual(sorted);                       // non-retrying: so mảng
```
</details>

### FC-10
**Tình huống:** Modal xác nhận. Verify nó **biến mất** sau khi bấm OK.
<details><summary>Đáp án</summary>

```ts
const dialog = page.getByRole('dialog');
await dialog.getByRole('button', { name: 'OK' }).click();
await expect(dialog).toBeHidden();   // auto-retry chờ nó ẩn
```
</details>

### FC-11
**Câu lý thuyết:** Khác nhau giữa `toBeVisible()` và `isVisible()`?
<details><summary>Đáp án</summary>

`expect(locator).toBeVisible()` = web-first, **auto-retry** đến timeout → chống flaky.
`locator.isVisible()` = trả boolean tức thời, **không chờ** → chỉ dùng cho rẽ nhánh logic, không dùng để assert.
</details>

### FC-12
**Câu lý thuyết:** `fill()` khác `pressSequentially()` chỗ nào? Khi nào cần cái sau?
<details><summary>Đáp án</summary>

`fill()` set thẳng value (nhanh). `pressSequentially()` gõ từng phím → trigger `keydown/keyup/input` — cần khi có autocomplete/mask/validation phản ứng theo từng ký tự.
</details>

### FC-13
**HTML:** `<a href="/products/E123-blue">...</a>` (nhiều link). Lấy danh sách product id.
<details><summary>Đáp án</summary>

```ts
const hrefs = await productList.getByRole('link')
  .evaluateAll(els => els.map(e => e.getAttribute('href') ?? ''));
const ids = hrefs.map(h => h.match(/products\/([A-Za-z0-9-]+)/)?.[1]).filter(Boolean);
// item.list.page.ts:344-352
```
</details>

### FC-14
**Tình huống:** Grid lazy-load. Cuộn đến khi số card không tăng nữa.
<details><summary>Đáp án</summary>

```ts
let prev = -1;
for (let i = 0; i < 40; i++) {
  const cur = await productList.getByRole('link').count();
  if (cur === prev) break;
  prev = cur;
  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(500);
}
// item.list.page.ts:291-301
```
</details>

### FC-15
**Câu lý thuyết:** Kể 3 cách chống flaky test ở tầng locator/assert.
<details><summary>Đáp án</summary>

1. Dùng **web-first assertions** (auto-retry) thay vì assert giá trị chụp 1 lần.
2. Dùng **auto-waiting actions** + `waitFor({ state })` thay vì `waitForTimeout` cứng.
3. **Locator ổn định** (role/testId, scoping, `.filter({ visible })`) để không dính element ẩn/trùng; tránh XPath theo index dễ vỡ.
</details>

### FC-16
**Tình huống:** Tận dụng nền API của bạn — chờ đúng API list load xong rồi mới assert UI.
<details><summary>Đáp án</summary>

```ts
const respP = page.waitForResponse(ItemListPage.PRODUCTS_API);  // regex — item.list.page.ts:40
await itemList.selectSort('Price: Low to high');
const resp = await respP;
expect(resp.status()).toBe(200);
await expect(itemList.firstProductPrice).toBeVisible();
```
</details>

### FC-17
**Câu lý thuyết:** Ở đầu trang Uniqlo (chưa scroll), `getByText('sản phẩm cuối cùng')` có locate được không? Vì sao?
<details><summary>Đáp án</summary>

**Không.** Uniqlo dùng infinite scroll (case B) — sản phẩm cuối chưa được fetch nên **chưa có trong DOM**; `count()` = 0, assert sẽ timeout. Phải scroll để trigger load thì element mới được append vào DOM.
</details>

### FC-18
**Câu lý thuyết:** Element nằm dưới cuối trang chưa hiện. `scrollIntoViewIfNeeded()` có luôn cứu được không?
<details><summary>Đáp án</summary>

Chỉ cứu **case A** (off-screen nhưng đã có trong DOM). Với **lazy-load/virtualization (B/C)** element chưa tồn tại trong DOM → không có gì để scroll tới → phải cuộn để trigger load trước. Phân biệt bằng `count()` ở đầu trang: ra tổng = A; ra số đang hiển thị = B/C.
</details>

### FC-19
**Tình huống:** Sau khi chọn "Price: Low to high", assert 10 giá đầu đã tăng dần.
<details><summary>Đáp án</summary>

```ts
const prices = await itemList.getProductPrices(10);       // parse ra number, DOM order
for (let i = 0; i < prices.length - 1; i++) {
  expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);   // <= cho phép giá trùng
}
// hoặc: expect(prices).toEqual([...prices].sort((a, b) => a - b));
```
Lưu ý: chờ `PRODUCTS_API`/`waitForGrid` xong mới đọc (tránh đọc giá của lần sort cũ).
</details>

### FC-20
**Câu bẫy:** `[10, 2, 100].sort()` ra gì? Vì sao nguy hiểm khi assert sort giá?
<details><summary>Đáp án</summary>

Ra `[10, 100, 2]` — `.sort()` mặc định so **theo chuỗi Unicode**, không theo số. Assert sort giá phải: (1) parse giá `"$100" → 100` thành **number**, (2) truyền comparator `(a, b) => a - b`. Quên 1 trong 2 → test pass/fail sai.
</details>

### FC-21
**Câu lý thuyết:** Ở đầu trang (chưa scroll), `expect(page.getByRole('contentinfo')).toBeVisible()` cho footer dưới đáy — pass hay fail? Vì sao?
<details><summary>Đáp án</summary>

**Pass.** Footer là markup tĩnh, có sẵn trong DOM (case A). Playwright coi element là *visible* khi không bị `display:none`/`visibility:hidden` và có bounding box — **không** xét viewport. Nằm ngoài màn hình vẫn tính visible. (Khác Selenium, nơi element ngoài viewport thường bị coi là không tương tác được.)
</details>

---

## Ôn nước rút (thứ tự)
1. Thuộc **cây ưu tiên locator** (role → ... → CSS) và giải thích được vì sao.
2. Phân biệt **auto-retry vs snapshot** (FC-11) — câu hỏi ranh giới.
3. Làm hết FC che-đáp-án 2 lượt; lượt 2 chỉ nhìn đề, viết ra giấy/editor.
4. Mở `item.list.page.ts` che locator → tự viết lại (bài active recall mạnh nhất).
