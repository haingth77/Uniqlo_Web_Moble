# Design Patterns & Principles (for QA Automation / SDET)

> Mục tiêu: trả lời tốt câu "thiết kế framework", "anh dùng design pattern nào", "SOLID/DRY là gì".
> Format: **Nó là gì → Thành phần → Ví dụ (ưu tiên context Playwright/test) → Q&A → Gotcha**.

---

## A. Nguyên tắc nền tảng (Principles)

### Nó là gì

Principles là **quy tắc tư duy** để code dễ đọc, dễ sửa, dễ test. Không phải code cụ thể — là kim chỉ nam. Interviewer hỏi để xem bạn có viết code "trưởng thành" hay không.

### Các nguyên tắc cốt lõi

| Viết tắt | Tên đầy đủ | Tinh thần 1 câu |
|---|---|---|
| **DRY** | Don't Repeat Yourself | Mỗi mẩu kiến thức/logic chỉ tồn tại **1 nơi**. |
| **KISS** | Keep It Simple, Stupid | Giải pháp đơn giản nhất chạy được; tránh over-engineer. |
| **YAGNI** | You Aren't Gonna Need It | Đừng code cho tính năng "sau này có thể cần". |
| **SoC** | Separation of Concerns | Mỗi phần lo 1 việc (UI / logic / data tách nhau). |
| **Composition over Inheritance** | — | Ưu tiên "has-a" hơn "is-a"; ghép nhỏ thay vì kế thừa sâu. |
| **Fail fast** | — | Lỗi thì báo ngay, sớm, rõ — đừng nuốt lỗi. |

### Ví dụ — DRY trong test

```ts
// ❌ WET (Write Everything Twice) — login lặp ở mọi test
test('test 1', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#user', 'admin');
  await page.fill('#pass', 'pw');
  await page.click('#submit');
  // ...
});
// (lặp y hệt ở test 2, 3, 4...)

// ✅ DRY — gom vào fixture / helper / Page Object
export const test = base.extend({
  authedPage: async ({ page }, use) => {
    await loginAs(page, 'admin');   // 1 nơi duy nhất
    await use(page);
  },
});
```

> [!GOTCHA]
> DRY bị **lạm dụng** = abstraction sai. Hai đoạn code "trông giống" nhưng thay đổi vì lý do khác nhau thì KHÔNG nên gộp (gộp xong sửa 1 cái phá cái kia). Quy tắc: trùng lặp về **kiến thức** mới gộp, trùng ngẫu nhiên thì để yên (Rule of Three: lặp 3 lần mới refactor).

### Q&A

**Q: DRY và KISS có khi nào mâu thuẫn?** Có. DRY quá đà tạo abstraction phức tạp (vi phạm KISS). Cân bằng: ưu tiên đọc hiểu; chỉ trừu tượng khi trùng lặp thật sự và ổn định.

**Q: YAGNI áp dụng cho test thế nào?** Đừng xây "framework siêu linh hoạt" cho 5 test. Bắt đầu đơn giản, refactor khi pattern lặp lại thật.

---

## B. SOLID — chi tiết từng nguyên tắc

### Nó là gì

5 nguyên tắc thiết kế OOP (Robert C. Martin) giúp code **dễ mở rộng, dễ test, ít coupling**. Đây là câu hỏi gần như chắc chắn ở interview middle+.

### S — Single Responsibility Principle (SRP)

**1 class chỉ nên có 1 lý do để thay đổi.**

```ts
// ❌ Class làm quá nhiều: locator + API + report
class HomePageBad {
  async search() {}
  async callSearchApi() {}        // việc của API client
  writeReportToFile() {}          // việc của reporter
}

// ✅ Tách trách nhiệm
class HomePage { async search() {} }        // chỉ UI interaction
class SearchApi { async query() {} }        // chỉ gọi API
class Reporter { write() {} }               // chỉ report
```

### O — Open/Closed Principle (OCP)

**Mở để mở rộng, đóng để sửa đổi.** Thêm hành vi mới bằng cách thêm code, không sửa code cũ (tránh phá thứ đang chạy).

```ts
// ❌ Mỗi loại mới phải sửa hàm cũ
function pay(method: string) {
  if (method === 'visa') {}
  else if (method === 'paypal') {}   // thêm loại = sửa hàm này
}

// ✅ Mở rộng qua interface
interface PaymentMethod { pay(amount: number): Promise<void>; }
class Visa implements PaymentMethod { async pay() {} }
class Paypal implements PaymentMethod { async pay() {} }
function checkout(m: PaymentMethod, amt: number) { return m.pay(amt); }
// thêm Momo = tạo class mới, KHÔNG đụng checkout()
```

### L — Liskov Substitution Principle (LSP)

**Subclass phải thay thế được superclass mà không phá behavior.**

```ts
// ❌ Vi phạm kinh điển: Square extends Rectangle
class Rectangle { setW(w){} setH(h){} }
class Square extends Rectangle {
  setW(w) { this.w = this.h = w; }   // set width đổi cả height → phá expectation
}
// Code mong Rectangle: setW(5); setH(4); area===20 → Square trả 16 → SAI
```
Fix: đừng dùng inheritance ở đây; tách abstraction `Shape` với `area()`.

### I — Interface Segregation Principle (ISP)

**Nhiều interface nhỏ, chuyên biệt > 1 interface to.** Đừng ép class implement method nó không cần.

```ts
// ❌ Interface béo
interface Worker { code(): void; test(): void; deploy(): void; }
// Tester buộc implement code() và deploy() dù không dùng

// ✅ Tách nhỏ
interface Coder { code(): void; }
interface Tester { test(): void; }
class QA implements Tester { test() {} }   // chỉ những gì cần
```

### D — Dependency Inversion Principle (DIP)

**Phụ thuộc vào abstraction, không phải concrete.** Module cao cấp không nên phụ thuộc trực tiếp module chi tiết.

```ts
// ❌ Test phụ thuộc trực tiếp client cụ thể
class UserTest { private api = new RealHttpClient(); }  // khó mock

// ✅ Inject abstraction → dễ thay mock khi test
interface HttpClient { get(url: string): Promise<unknown>; }
class UserTest {
  constructor(private http: HttpClient) {}   // inject — test truyền mock được
}
```

### Q&A

**Q: SOLID nào quan trọng nhất với test automation?** SRP (Page Object chỉ lo 1 page) + DIP (inject dependency → mock dễ) là dùng nhiều nhất. OCP giúp framework mở rộng matcher/reporter không phá code cũ.

**Q: Ví dụ SRP trong Page Object Model?** `LoginPage` chỉ chứa locator + action của trang login. API call tách ra `AuthApi`, assertion tách ra test, data tách ra fixture/factory.

**Q: DIP liên quan gì tới Dependency Injection?** DIP là nguyên tắc (phụ thuộc abstraction); DI là kỹ thuật thực hiện (truyền dependency từ ngoài vào qua constructor/param) — Playwright fixture chính là DI.

> [!KEY]
> Mẹo trả lời SOLID: với mỗi chữ, nói **1 câu định nghĩa + 1 ví dụ từ chính framework của bạn** (POM, fixture, API client). Interviewer thích ví dụ thật hơn lý thuyết suông.

---

## C. Design Patterns (GoF) — cái hay dùng trong automation

### Nó là gì

Design pattern = **giải pháp tái sử dụng cho vấn đề thiết kế lặp lại**. 23 pattern GoF chia 3 nhóm: **Creational** (tạo object), **Structural** (ghép object), **Behavioral** (giao tiếp giữa object). Dưới đây là các pattern thực sự xuất hiện trong test framework.

### 1. Page Object Model (biến thể của Facade/Adapter)

Đóng gói locator + action của 1 trang vào 1 class → test đọc như ngôn ngữ nghiệp vụ, locator đổi chỉ sửa 1 nơi.

```ts
class LoginPage {
  constructor(private page: Page) {}
  async login(u: string, p: string) {
    await this.page.fill('#user', u);
    await this.page.fill('#pass', p);
    await this.page.click('#submit');
  }
}
```

### 2. Factory

Tạo object/test-data mà không lộ logic khởi tạo. Dùng nhiều cho **test data builder**.

```ts
// Factory cho test data — mỗi lần gọi tạo object MỚI (tránh share/mutate)
function makeUser(overrides: Partial<User> = {}): User {
  return { id: 1, name: 'Default', email: 'd@x.com', role: 'user', ...overrides };
}
const admin = makeUser({ role: 'admin' });
```

### 3. Builder

Dựng object phức tạp từng bước, dễ đọc — hay dùng cho request/test data nhiều field.

```ts
class RequestBuilder {
  private req: Partial<Req> = {};
  url(u: string) { this.req.url = u; return this; }       // chainable
  header(k: string, v: string) { (this.req.headers ??= {})[k] = v; return this; }
  build(): Req { return this.req as Req; }
}
const r = new RequestBuilder().url('/api').header('Auth', 'token').build();
```

### 4. Singleton

1 instance duy nhất toàn app — vd config, logger, browser pool. Cẩn thận: gây shared state khó test.

```ts
class Config {
  private static instance: Config;
  static get(): Config { return (this.instance ??= new Config()); }
}
```

### 5. Strategy

Đổi thuật toán/hành vi lúc runtime qua interface chung (≈ OCP). Vd chọn cách auth, chọn reporter.

```ts
interface WaitStrategy { wait(page: Page): Promise<void>; }
class NetworkIdle implements WaitStrategy { async wait(p) { await p.waitForLoadState('networkidle'); } }
class Selector implements WaitStrategy { async wait(p) { await p.waitForSelector('.ready'); } }
async function open(page: Page, strategy: WaitStrategy) { await strategy.wait(page); }
```

### 6. Observer / Pub-Sub

Object đăng ký lắng nghe sự kiện. Test reporter của Playwright (`onTestEnd`, `onStepEnd`) chính là observer.

```ts
class Reporter {
  onTestEnd(test, result) { console.log(test.title, result.status); }
}
```

### 7. Decorator

Bọc thêm hành vi quanh function/object mà không sửa nó. Vd thêm retry/log quanh 1 action.

```ts
function withRetry<A extends unknown[], R>(fn: (...a: A) => Promise<R>, max = 3) {
  return async (...args: A): Promise<R> => {
    for (let i = 0; i < max; i++) {
      try { return await fn(...args); } catch (e) { if (i === max - 1) throw e; }
    }
    throw new Error('unreachable');
  };
}
const safeClick = withRetry(click);
```

### 8. Adapter

Chuyển interface này sang interface khác cho tương thích. Vd bọc 2 HTTP client (axios/fetch) sau 1 interface chung.

### Q&A

**Q: Framework của bạn dùng pattern nào?** POM (Facade), Factory cho test data, Builder cho request, Strategy cho wait/auth, Fixture (DI) cho setup/teardown, Observer cho reporter. Nói kèm "vì sao": giảm trùng lặp, dễ bảo trì, dễ mock.

**Q: Singleton có hại gì cho test?** Tạo **global mutable state** → test này ảnh hưởng test kia, khó chạy song song, khó reset. Ưu tiên DI thay vì singleton khi có thể.

**Q: Phân biệt Factory vs Builder?** Factory tạo object trong 1 lời gọi (đơn giản). Builder dựng từng bước, chainable (nhiều field/biến thể, dễ đọc).

> [!GOTCHA]
> Đừng "nhồi pattern" để khoe. Interviewer middle thích thấy bạn dùng đúng pattern cho đúng vấn đề (POM, Factory, Fixture) hơn là kể tên 23 pattern GoF.

> [!TIP]
> Liên hệ ngược: SRP → POM; OCP/DIP → Strategy + interface; DI → Fixture; DRY → helper/factory. Trả lời theo cặp "nguyên tắc ↔ pattern ↔ ví dụ thật" sẽ rất mạnh.

---

## D. Ví dụ THẬT từ framework này (Uniqlo — Playwright + TS)

> Đây là phần "ăn điểm" nhất khi phỏng vấn: kể pattern kèm code thật từ project mình từng làm, thay vì lý thuyết suông. Mỗi mục có sẵn **"Câu nói khi phỏng vấn"** để dùng ngay.

### 1. Page Object Model — `base.page.ts`, `home.page.ts`, `item.list.page.ts`

Mỗi trang = 1 class, chứa locator + action riêng. Test chỉ gọi tên, không đụng locator thô.

```ts
// home.page.ts — locator gói trong class, đổi UI chỉ sửa 1 nơi
export class HomePage extends BasePage {
  btnMen    = this._page.getByRole('tab', { name: 'men', exact: true });
  btnSearch = this._page.getByRole('button', { name: this.t.Search });
  txbSearch = this._page.getByRole('searchbox', { name: this.t.Search });
}
```

> **Câu nói khi phỏng vấn:** *"Em áp dụng Page Object Model — mỗi trang là một class chứa locator và hành động của trang đó. Test không chứa CSS/XPath thô, nên khi UI đổi em chỉ sửa trong page class, không phải sờ vào test."*

**Principle liên quan:** SRP (mỗi page lo 1 trang), DRY (locator định nghĩa 1 nơi).

### 2. Inheritance + Base class (Template-ish) — `base.page.ts`

`BasePage` giữ thứ **chung cho mọi trang**: `_page`, locale `t`, và `acceptCookiesIfShown()`. Mọi page `extends` nó.

```ts
export class BasePage {
  readonly _page: Page;
  readonly t: LocaleStrings;
  constructor(page: Page) {
    this._page = page;
    this.t = Locales[getLocale()];   // mọi page tự có bộ chuỗi đúng ngôn ngữ
  }
  async acceptCookiesIfShown(timeout = 3000) { /* logic chung, viết 1 lần */ }
}
export class HomePage extends BasePage { constructor(page: Page) { super(page); } }
```

> **Câu nói khi phỏng vấn:** *"Em có một `BasePage` chứa những thứ dùng chung như cookie banner và bộ chuỗi locale, các page kế thừa nó — đúng tinh thần DRY. Em có cân nhắc composition thay vì inheritance, nhưng ở đây tất cả page thật sự 'is-a' page và cùng chia sẻ cùng một `Page` context nên inheritance 1 tầng là hợp lý, chưa cần phức tạp hóa (KISS)."*

> [!GOTCHA]
> Interviewer có thể "gài": *"Sao không dùng composition over inheritance?"* → Trả lời: inheritance **1 tầng, nông** cho thứ thật sự chung thì ổn; điều cần tránh là kế thừa **sâu nhiều tầng**. Nếu sau này logic phình to (auth, API, cookie...) thì tách helper và **compose** vào page sẽ tốt hơn kế thừa thêm tầng.

### 3. Dependency Injection qua Fixture — `fixture.ts`

Playwright fixture = DI thực thụ. `appPage` lo sẵn goto + đợi load + accept cookie, rồi **inject** page đã sẵn sàng vào test.

```ts
export const test = baseTest.extend<Fixtures>({
  appPage: async ({ page }, use) => {
    await page.goto(AppUrl.Default);
    await page.waitForLoadState('domcontentloaded');
    await new BasePage(page).acceptCookiesIfShown();
    await use(page);            // test nhận page đã sẵn sàng — setup nằm 1 nơi
  },
});
// test chỉ cần: test('...', async ({ appPage }) => { ... })
```

> **Câu nói khi phỏng vấn:** *"Setup lặp lại (mở trang, đợi load, tắt cookie banner) em gom vào một Playwright fixture tên `appPage`. Đây chính là Dependency Injection: test không tự dựng state mà nhận sẵn từ ngoài — vừa DRY, vừa giúp mỗi test độc lập nên chạy song song an toàn."*

**Principle liên quan:** DIP (test phụ thuộc "một page đã sẵn sàng", không quan tâm cách dựng), DRY, SRP.

### 4. Strategy / Lookup cho i18n + OCP — `locales.ts` + `constant.enum.ts` ⭐

Đây là ví dụ **thiết kế xịn nhất** trong repo. `getLocale()` đọc URL → chọn bộ chuỗi (`us`/`uk`/`vn`). Page dùng `this.t.Search` mà **không cần biết** đang ở locale nào.

```ts
// constant.enum.ts — chọn "strategy" ngôn ngữ theo runtime (từ BASE_URL)
export function getLocale(): Locale {
  if (pathname.endsWith('/vn/en/')) return 'vn';
  if (pathname.endsWith('/uk/en/')) return 'uk';
  return 'us';
}
// locales.ts — mỗi locale là 1 bộ chuỗi (1 "strategy")
export const Locales = {
  us: { Search: 'Search', /* ... */ },
  uk: { Search: 'What are you looking for?', /* ... */ },
  vn: { Search: 'What are you looking for?', /* ... */ },
} as const;
// home.page.ts — dùng chung, không rẽ nhánh if/else theo nước
btnSearch = this._page.getByRole('button', { name: this.t.Search });
```

> **Câu nói khi phỏng vấn:** *"Uniqlo chạy nhiều thị trường nên chuỗi UI khác nhau. Thay vì rải `if country === 'uk'` khắp test, em tách bảng locale: `getLocale()` chọn bộ chuỗi theo URL, page chỉ tham chiếu `this.t.Search`. Muốn thêm thị trường mới em chỉ thêm một key vào `Locales`, không sửa một dòng page hay test nào — đúng Open/Closed Principle."*

> [!KEY]
> Đây là chỗ thể hiện **OCP** rõ nhất: *mở để mở rộng* (thêm locale = thêm data), *đóng để sửa đổi* (không đụng code page/test). Nêu được điều này ở interview là điểm cộng lớn — nó chứng minh bạn hiểu principle qua hành động thật, không chỉ định nghĩa.

### 5. Centralized Config (kiểu Singleton/module) — `constant.enum.ts`

`AppUrl` là nguồn config **duy nhất**, đọc từ env với default an toàn. Module TS được cache → hiệu ứng như singleton, nhưng không có class Singleton mutable rối rắm.

```ts
export const AppUrl = {
  Default: process.env.BASE_URL ?? DEFAULT_BASE_URL,   // 1 nguồn sự thật cho URL
} as const;
```

> **Câu nói khi phỏng vấn:** *"Config như base URL em để một chỗ duy nhất, đọc từ biến môi trường với default. Em dùng module const thay vì class Singleton để tránh global mutable state — vẫn 'một nguồn sự thật' nhưng không gây trạng thái chia sẻ khó test."*

### 6. Graceful degradation (bàn về Fail-fast) — `acceptCookiesIfShown()`

Cookie banner **có khi hiện có khi không**. Hàm này cố tình **nuốt lỗi timeout** — đây là ngoại lệ có chủ đích của "fail fast".

```ts
try {
  await acceptBtn.waitFor({ state: 'visible', timeout });
  await acceptBtn.click();
} catch {
  // Banner không hiện trong timeout — bỏ qua có chủ đích, KHÔNG fail test
}
```

> **Câu nói khi phỏng vấn:** *"Nguyên tắc chung là fail-fast, nhưng cookie banner là thứ optional — không phải điều em đang test. Nên em xử lý mềm: có thì tắt, không có thì bỏ qua. Cái em cẩn thận là chỉ nuốt lỗi ở đúng chỗ optional này, còn assertion nghiệp vụ thì vẫn phải fail rõ ràng."*

### 7. Cái CHƯA có — và vì sao (YAGNI) — Factory / Builder

Repo **chưa** có Factory/Builder vì test hiện chủ yếu là UI navigation, chưa cần dựng test data phức tạp.

> **Câu nói khi phỏng vấn:** *"Framework này em chưa dùng Factory hay Builder vì test hiện tại chưa cần dựng data phức tạp — thêm vào lúc này là over-engineer (YAGNI). Khi nào có phần API tạo user/order với nhiều field, em sẽ thêm Builder cho request và Factory cho test data — đó là lúc chúng thật sự trả lại giá trị."*

> [!KEY]
> Biết **khi nào KHÔNG dùng pattern** cũng quan trọng như biết dùng. Câu trả lời này biến "framework còn thiếu" thành "em thiết kế có chủ đích, thêm đúng lúc".

### Bảng tra nhanh: file ↔ pattern ↔ principle (để ôn trước phỏng vấn)

| File | Pattern | Principle | 1 câu chốt |
|---|---|---|---|
| `home/item.list.page.ts` | Page Object | SRP, DRY | Mỗi trang 1 class, locator gói kín |
| `base.page.ts` | Inheritance/Template | DRY, KISS | Thứ chung viết 1 lần cho mọi page |
| `fixture.ts` | Fixture = DI | DIP, SRP | Inject page đã setup sẵn, test độc lập |
| `locales.ts` + `getLocale()` | Strategy/Lookup | **OCP** | Thêm thị trường = thêm data, không sửa code |
| `constant.enum.ts` | Config module | Single source | 1 nguồn config, tránh global mutable |
| `acceptCookiesIfShown` | Graceful degrade | Fail-fast (có ngoại lệ) | Nuốt lỗi đúng chỗ optional |
