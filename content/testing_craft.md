# Testing Craft — BDD, Test Doubles, Contract Testing, Code Quality

> Bù đúng feedback: **BDD, stubbing, contract testing, tích hợp code quality tool**.
> Format: **Nó là gì → Thành phần → Ví dụ → Q&A → Gotcha**.

---

## A. BDD — Behavior-Driven Development

### Nó là gì

BDD là cách viết test mô tả **hành vi nghiệp vụ** bằng ngôn ngữ tự nhiên (business-readable), để **dev + QA + PO** cùng đọc hiểu. Mở rộng từ TDD nhưng tập trung vào "behavior" thay vì "unit". Ngôn ngữ phổ biến: **Gherkin** (Given/When/Then).

### Thành phần

| Thành phần | Vai trò |
|---|---|
| **Feature file** (`.feature`) | Mô tả nghiệp vụ bằng Gherkin — business đọc được |
| **Scenario** | 1 tình huống cụ thể |
| **Given** | Bối cảnh / tiền điều kiện (setup) |
| **When** | Hành động kích hoạt |
| **Then** | Kết quả mong đợi (assertion) |
| **And / But** | Nối thêm bước |
| **Step definition** | Code thực thi từng bước Gherkin (glue code) |
| **Scenario Outline + Examples** | Data-driven: 1 scenario chạy nhiều bộ data |
| **Background** | Bước chung chạy trước mọi scenario |
| **Tags** (`@smoke`) | Lọc/nhóm scenario khi chạy |

### Ví dụ

```gherkin
# login.feature
Feature: User login

  Background:
    Given the user is on the login page

  @smoke
  Scenario: Successful login
    When the user logs in with "admin" and "correct-pw"
    Then the dashboard should be visible

  Scenario Outline: Invalid login shows error
    When the user logs in with "<user>" and "<pass>"
    Then an error "<message>" should appear

    Examples:
      | user  | pass    | message              |
      | admin | wrong   | Invalid credentials  |
      |       | pw      | Username required    |
```

```ts
// steps/login.steps.ts (Cucumber.js + Playwright)
import { Given, When, Then } from '@cucumber/cucumber';

Given('the user is on the login page', async function () {
  await this.page.goto('/login');
});
When('the user logs in with {string} and {string}', async function (user, pass) {
  await this.loginPage.login(user, pass);
});
Then('the dashboard should be visible', async function () {
  await expect(this.page.locator('#dashboard')).toBeVisible();
});
```

### Q&A

**Q: BDD vs TDD?** TDD: viết test trước code, góc nhìn developer (unit). BDD: viết behavior trước, ngôn ngữ chung cho cả non-tech, tập trung "hệ thống cư xử thế nào". BDD thường nằm ở tầng acceptance/E2E.

**Q: Khi nào KHÔNG nên dùng BDD?** Khi business **không thực sự đọc** feature file → Gherkin chỉ là lớp overhead (thêm step definition, khó debug). Nếu chỉ team kỹ thuật đọc, viết test code trực tiếp gọn hơn.

**Q: 3 amigos là gì?** Buổi họp PO + Dev + QA cùng định nghĩa acceptance criteria/scenario trước khi code → đó là tinh thần thật của BDD (collaboration), không chỉ là cú pháp Gherkin.

> [!GOTCHA]
> BDD ≠ Cucumber. BDD là **phương pháp** (collaboration + ví dụ cụ thể); Cucumber/Gherkin chỉ là **công cụ**. Có thể làm BDD mà không cần Gherkin.

> [!GOTCHA]
> Playwright KHÔNG tích hợp Cucumber native → phải tự ghép `@cucumber/cucumber` + custom World (giữ `page`, `context`). Cân nhắc chi phí maintain.

---

## B. Test Doubles — Stub, Mock, Spy, Fake, Dummy

### Nó là gì

**Test double** = object "đóng thế" cho dependency thật khi test, để **cô lập** unit đang test (không gọi DB/network thật, kiểm soát được kết quả). "Mock" hay bị dùng chung chung, nhưng đúng kỹ thuật có 5 loại (Gerard Meszaros / Martin Fowler).

### Thành phần / 5 loại

| Loại | Mục đích | Kiểm tra điều gì |
|---|---|---|
| **Dummy** | Chỉ để lấp tham số, không dùng | — |
| **Stub** | Trả về **giá trị cố định** đã định trước | State (kết quả) |
| **Spy** | Stub + **ghi lại** cách nó được gọi | Đã gọi mấy lần / với arg gì |
| **Mock** | Object có **expectation** định trước, fail nếu gọi sai | Behavior (interaction) |
| **Fake** | Implement thật nhưng đơn giản (in-memory DB) | State, dùng được như thật |

**Quy tắc phân biệt nhanh:**
- **Stub** = "khi gọi `getUser()`, **trả về** `{id:1}`" → quan tâm **OUTPUT**.
- **Mock** = "tôi **mong** `sendEmail()` được gọi **đúng 1 lần** với arg X" → quan tâm **INTERACTION**.
- **Spy** = wrap hàm thật/giả để **đếm/ghi** lời gọi, rồi assert sau.

### Ví dụ

```ts
// === STUB: ép giá trị trả về (Playwright route = network stub) ===
await page.route('**/api/products', (route) =>
  route.fulfill({ status: 200, body: JSON.stringify([{ id: 1, name: 'Stubbed' }]) }),
);
// Test FE render đúng với data cố định, không phụ thuộc backend

// Stub lỗi để test error handling
await page.route('**/api/checkout', (route) => route.fulfill({ status: 500 }));

// === MOCK (Jest/Vitest): kiểm tra interaction ===
const sendEmail = vi.fn();
notifyUser(user, sendEmail);
expect(sendEmail).toHaveBeenCalledTimes(1);
expect(sendEmail).toHaveBeenCalledWith('h@x.com', 'Welcome');

// === SPY: theo dõi hàm thật vẫn chạy ===
const spy = vi.spyOn(logger, 'info');
doWork();
expect(spy).toHaveBeenCalledWith('done');
spy.mockRestore();

// === FAKE: in-memory implementation ===
class FakeUserRepo implements UserRepo {
  private store = new Map<number, User>();
  async save(u: User) { this.store.set(u.id, u); }
  async find(id: number) { return this.store.get(id) ?? null; }
}
```

### Q&A

**Q: Stub vs Mock khác gì?** Stub cung cấp **dữ liệu** (quan tâm output/state). Mock đặt **kỳ vọng về cách gọi** và verify interaction (quan tâm behavior). Nói gọn: stub answer queries, mock verify commands.

**Q: Khi nào mock/stub trong test?** Khi dependency: chậm (network/DB), non-deterministic (time, random), khó tạo (3rd-party, payment), hoặc chưa sẵn sàng (service đang dev). Mục đích: cô lập + ổn định + nhanh.

**Q: Rủi ro của mock?** **Mock drift** — mock không còn khớp service thật → test xanh nhưng prod fail. Giảm bằng contract test + một ít integration/E2E test thật.

**Q: Trong Playwright stub network thế nào?** `page.route(pattern, handler)` để intercept → `route.fulfill()` (trả response giả), `route.abort()` (giả lỗi mạng), `route.continue()` (cho qua, có thể sửa request).

> [!GOTCHA]
> Mock 500 là test **FE xử lý lỗi**, KHÔNG phải test server. Đừng nhầm mục đích.

> [!GOTCHA]
> Over-mocking = test chỉ kiểm tra mock, không kiểm tra hành vi thật → "test mình mock". Mock biên giới (network, DB), không mock logic đang test.

---

## C. Contract Testing

### Nó là gì

Contract testing verify rằng **giao kèo (request/response shape)** giữa **consumer** (vd FE / service gọi) và **provider** (vd BE / service bị gọi) khớp nhau — mà không cần dựng cả 2 service cùng lúc. Giải bài toán microservices: integration test thật thì chậm/giòn, mock thì dễ drift.

### Thành phần (Consumer-Driven Contract — Pact)

| Thành phần | Vai trò |
|---|---|
| **Consumer** | Bên gọi API; định nghĩa kỳ vọng (mong response thế nào) |
| **Provider** | Bên cung cấp API; phải thoả contract |
| **Contract / Pact file** | File JSON ghi lại request mẫu + response mong đợi |
| **Pact Broker** | Server lưu & chia sẻ pact giữa các team, version, tag |
| **Consumer test** | Chạy với mock provider → sinh pact file |
| **Provider verification** | Provider replay pact lên service thật → fail nếu break |

### Luồng

```
1. Consumer test: gọi mock theo kỳ vọng  → sinh pact file (consumer-provider.json)
2. Publish pact lên Pact Broker
3. Provider CI: tải pact → replay request lên service thật → verify response khớp
4. Nếu provider đổi response phá contract → provider build FAIL (bắt được sớm)
5. can-i-deploy: hỏi broker "version này deploy an toàn chưa?"
```

### Ví dụ (Pact JS — consumer side)

```ts
const provider = new PactV3({ consumer: 'WebApp', provider: 'UserService' });

provider
  .given('user 1 exists')
  .uponReceiving('a request for user 1')
  .withRequest({ method: 'GET', path: '/users/1' })
  .willRespondWith({
    status: 200,
    body: { id: like(1), name: like('Hai') },   // matcher: khớp KIỂU, không khớp giá trị cứng
  });

await provider.executeTest(async (mockServer) => {
  const res = await getUser(mockServer.url, 1);
  expect(res.name).toBeDefined();
});
// → sinh pact file để provider verify
```

### Q&A

**Q: Contract test vs integration test?** Integration test dựng nhiều service thật → chậm, giòn, khó cô lập lỗi. Contract test verify giao kèo độc lập từng phía → nhanh, chạy được khi service kia chưa sẵn sàng, bắt được breaking change sớm. Không thay thế hoàn toàn E2E.

**Q: Consumer-driven nghĩa là gì?** Consumer định nghĩa nó **cần gì** từ provider (chỉ phần dùng tới), provider phải đáp ứng tối thiểu đó. → Provider biết đổi gì sẽ phá ai.

**Q: Vì sao dùng matcher (`like`, `eachLike`) thay giá trị cứng?** Để contract kiểm tra **schema/kiểu** thay vì giá trị exact (giá trị thật đổi liên tục). Tránh test giòn.

**Q: Contract test giải quyết mock drift thế nào?** Mock được "chứng thực" bởi provider verification — nếu provider đổi response, verification fail → mock (pact) không còn lệch âm thầm.

> [!GOTCHA]
> Contract test KHÔNG kiểm tra business logic đúng/sai — chỉ kiểm tra **shape giao kèo**. Vẫn cần functional test riêng.

> [!TIP]
> Tool: **Pact** (consumer-driven, đa ngôn ngữ), **Spring Cloud Contract** (Java). Pact Broker + `can-i-deploy` là phần "xịn" để gate deploy.

---

## D. Code Quality Tools — tích hợp pipeline

### Nó là gì

Bộ công cụ tự động **chặn code kém chất lượng** trước khi vào main: format nhất quán, bắt lỗi tĩnh, đo coverage, chạy ở pre-commit hook + CI. Đây là dấu hiệu codebase "trưởng thành" interviewer hay đào.

### Thành phần (hệ JS/TS)

| Tool | Vai trò | Chạy ở đâu |
|---|---|---|
| **ESLint** | Static analysis — bắt bug & code smell (vd `no-floating-promises`) | pre-commit + CI |
| **Prettier** | Auto-format (style nhất quán) — KHÔNG bắt bug | pre-commit |
| **TypeScript (`tsc --noEmit`)** | Type check | CI |
| **Husky** | Quản lý Git hooks (chạy lint/test trước commit/push) | local Git hook |
| **lint-staged** | Chỉ lint/format file **đã staged** (nhanh) | pre-commit |
| **commitlint** | Ép format commit message (Conventional Commits) | commit-msg hook |
| **Jest/Vitest coverage** | Đo % code được test | CI, có thể set threshold |
| **SonarQube / CodeClimate** | Đo code smell, duplication, coverage, security trên dashboard | CI |
| **Dependabot / npm audit** | Quét lỗ hổng dependency | CI / scheduled |

### Ví dụ — pre-commit gate

```jsonc
// package.json
{
  "scripts": { "lint": "eslint . --max-warnings 0", "format": "prettier --write ." },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

```bash
# .husky/pre-commit — chặn commit nếu lint fail
npx lint-staged

# .husky/pre-push — chạy test trước khi push
npx playwright test --project=chromium
```

```yaml
# CI gate (GitHub Actions) — fail PR nếu vi phạm
- run: npm run lint
- run: npx tsc --noEmit
- run: npx playwright test
- run: npx playwright test --reporter=html   # artifact
```

### Q&A

**Q: ESLint vs Prettier khác gì?** ESLint = **chất lượng/logic** (bắt bug, anti-pattern, có thể auto-fix vài rule). Prettier = **format** (dấu cách, xuống dòng) — không quan tâm logic. Dùng chung: Prettier lo style, ESLint lo lỗi; tránh rule format trùng nhau (`eslint-config-prettier` tắt rule xung đột).

**Q: Husky để làm gì?** Cài/quản lý Git hooks dễ dàng (lưu trong repo, share cả team). Thường: `pre-commit` → lint-staged; `commit-msg` → commitlint; `pre-push` → test nhanh.

**Q: Vì sao dùng lint-staged thay vì lint cả repo mỗi commit?** Lint cả repo chậm. lint-staged chỉ xử lý file đang commit → feedback nhanh, dev không bỏ qua hook.

**Q: Quality gate trong CI là gì?** Điều kiện bắt buộc PASS mới được merge: lint sạch, type check pass, test pass, coverage ≥ ngưỡng (vd SonarQube quality gate). Fail thì block merge.

**Q: Coverage 80% có nghĩa code tốt?** Không hẳn. Coverage đo **dòng được chạy**, không đo **assertion có ý nghĩa**. 100% coverage vẫn có thể không test đúng hành vi. Dùng coverage để tìm **vùng chưa test**, không phải mục tiêu tự thân.

> [!GOTCHA]
> Hook local (Husky) có thể bị bypass bằng `git commit --no-verify`. → Quality gate THẬT phải đặt ở **CI** (server-side), không chỉ tin vào local hook.

> [!TIP]
> Câu trả lời mạnh: "Tôi đặt lint/format/type-check ở **cả** pre-commit (feedback nhanh) **và** CI (gate cứng), coverage threshold trong CI, commit theo Conventional Commits để auto-changelog/semver."
