Playwright Notes

## Issue 01: getByRole resolves to input but click is blocked by span overlay

### Bối cảnh

- Trường hợp thực tế:
  - Label có 2 thẻ con: một `input` và một `span` custom radio.
  - Locator như `getByLabel('Individual Employee').locator('..').getByRole('radio')` hoặc `getByText(...).locator('..').getByRole('radio')` trả về `input`.

### Triệu chứng

- Playwright log:
  - `resolved to <input type="radio"...>`
  - `span ... intercepts pointer events`
- Test bị timeout dù `input` đã visible, enabled và stable.

### Nguyên nhân

- `getByRole('radio')`/`getByLabel` tìm tới `input` vì đó là form control có role hợp lệ.
- Trong UI custom (ví dụ OrangeHRM), phần tử nhận pointer thường là span/icon wrapper (`.oxd-radio-input`) chứ không phải input gốc.
- Input vẫn là node đúng cho accessibility, nhưng không phải node tốt nhất để `click()` trong trường hợp này.

### Cách khắc phục (khuyến nghị)

1. Click trực tiếp vào span radio trong label: dùng Xpath or CSS để locate thẳng vào label.

```ts
// Ví dụ trực tiếp vào label span
await this.getPage
  .locator('label:has-text("Individual Employee") .oxd-radio-input')
  .click();
```

2. Hoặc dùng `force: true` khi đã chắc selector đúng nhưng bị pointer overlay chặn.

```ts
// Dùng ElementWrapper
await leavePage.optIndividualEmployee.getElement().click({ force: true });

// Hoặc gọi wrapper method bạn đã có
await leavePage.optIndividualEmployee.click(true);
```

### Quy tắc nhớ nhanh

- `getByLabel` hay `getByRole` thường tốt để nhận diện control theo accessibility.
- Khi click bị `pointer events` / overlay chặn, kiểm tra lại xem visual control có phải là sibling/span không.
- Ưu tiên selector theo phần tử thật sự nhận sự kiện click (thường là label/span), không chỉ control gốc.

## Issue 02: getByText sai ý đồ khi element text không phải target action

### Bối cảnh

- Dùng `getByText()` để "tìm row", rồi đi xuống con có thể không luôn trúng đúng control cần tương tác.
- Nếu text chỉ nằm ở `label/span`, còn action gắn ở icon/input khác, `getByText` chỉ giúp locate text node, chưa đảm bảo trúng element cần click/input.

### Ví dụ hay gặp

```ts
// Có text trong label, nhưng control nhận event là button icon cùng row
const row = page.getByText('Individual Employee');
await row.locator('..').locator('input').click();
```

Lỗi: locator vẫn có thể resolve vào node trung gian và click fail do event target không đúng.

### Cách nên làm

1. Bám theo role/form control luôn khi có thể:

```ts
// Stable hơn: lấy theo accessible name
await page.getByRole('radio', { name: 'Individual Employee' }).click();
```

2. Hoặc xác định rõ container rồi bám đến control con đúng:

```ts
const row = page.locator('label:has-text("Individual Employee")');
await row.locator('.oxd-radio-input').click();
```

3. Khi cần text + action: ưu tiên `locator(...).filter({ hasText: ... })` để thu hẹp phạm vi.

```ts
const row = page.locator('form').filter({ hasText: 'Add Entitlements' });
await row.locator('label:has-text("Individual Employee") .oxd-radio-input').click();
```

### Quy tắc nhớ nhanh

- Dùng `getByText` cho thao tác đọc/khớp text.
- Với action click/fill thì ưu tiên locator tới control thực tế (`input`, `button`, `span` click target), không chỉ node chứa text.

## Issue 03: waitForPageLoad không thay cho wait cho data/render

### Bối cảnh

- `waitForPageLoad(state)` chỉ đợi load state của page/chromium event, không đợi dropdown/input mới render xong theo UI.
- Trong nhiều app có call API nền hoặc animation, `waitForPageLoad` có thể chưa đủ để actionable.

### Cách khuyến nghị

1. Giữ `waitForPageLoad` ở mức `domcontentloaded` (an toàn hơn cho app có polling).
2. Sau đó wait theo element cần thao tác:

```ts
await leavePage.tabEntitlements.click();
await expect(leavePage.optAddEntitlement.getElement()).toBeVisible();
await leavePage.optAddEntitlement.click();

await expect(leavePage.tbxEmployeeName.getElement()).toBeVisible();
```

3. Tránh chờ `networkidle` nếu app có interval API.

### Quy tắc nhớ nhanh

- `domcontentloaded` = đủ để bắt đầu tương tác.
- "Stable test" đến từ assertion theo phần tử nghiệp vụ: `toBeVisible`, `toBeEnabled`, `toContainText`.

## Issue 04: Phân biệt page wait và element wait, khi nào dùng `page.waitForSelector`

### 1) Page wait (đợi trạng thái cấp trang)

Page wait là đợi các event của toàn trang, không trỏ tới một element cụ thể.

Các API chính:

```ts
// Đợi mức độ tải trang
await page.waitForLoadState('domcontentloaded');
await page.waitForLoadState('load');

// Đợi navigation hoặc URL thay đổi
await page.waitForURL('**/Leave/List');

// Chờ response navigation
await page.waitForNavigation();
```

Khi dùng:
- Tạo ranh giới bước lớn như chuyển route/nội dung trang mới.
- Kết hợp trước các hành động trên một màn hình mới.
- Tránh dùng như chờ cho một input cụ thể.

### 2) Element/locator wait (đợi trạng thái của 1 phần tử)

Element wait bám vào đúng đối tượng cần tác động/verify.

```ts
await expect(leavePage.optAddEntitlement.getElement()).toBeVisible();
await expect(tbxEmployeeName.getElement()).toBeEnabled();
await page.getByRole('row', { name: '...' }).waitFor({ state: 'visible' });
```

`locator.waitFor` hoặc `expect(...).toBeVisible()` đã auto-wait rất tốt cho action và assertion.
Đây là cách ưu tiên cho test ổn định:
- tránh flake vì chờ đúng trạng thái nghiệp vụ
- không chờ chung chung

### 3) Khi nào dùng `page.waitForSelector`

`page.waitForSelector(selector, ...)` KHÁC với `page.waitForLoadState`:
- vẫn cần `selector` cụ thể.
- dùng để chờ phần tử theo selector xuất hiện/ẩn/được gắn vào DOM (attached/visible) hoặc biến mất (hidden/detached).

Ví dụ:

```ts
await page.waitForSelector('.oxd-loading-spinner', { state: 'hidden' });
await page.waitForSelector('.toast-success', { state: 'detached' });
```

Khi nên dùng:
- Có logic cần chờ theo selector trước khi branch test.
- Môi trường code cũ đang dùng selector trực tiếp.
- Muốn chờ `hidden`/`detached` trước khi thao tác phần tử kế tiếp.

Khi không nên dùng:
- Dùng thay cho `click()`/`fill()` tự có auto-wait.
- Dùng thay vì chọn đúng locator nghiệp vụ trong POM.

### Quy tắc chọn nhanh

1. Dùng **page wait** cho event cấp trang (`domcontentloaded`, navigation).
2. Dùng **element wait** cho nghiệp vụ UI (`visible`, `enabled`, `hidden`, `detached`).
3. Dùng `page.waitForSelector` khi cần chờ theo selector dạng legacy hoặc cần `hidden/detached` rõ ràng.

## Issue 05: Multi-element locator vs single element action (Strict mode)

### Bối cảnh

- Trong table, `row.getByRole('cell')` trả về nhiều phần tử (nhiều cell trong cùng 1 row).
- Trong case thực tế `Entitlement`, khi dùng
  `const row = page.getByRole('row').filter({ hasText: 'CAN - Vacation' })` và
  `const cells = row.getByRole('cell')`,
  locator `cells` là list (ví dụ 7 cell).

### Vấn đề gặp

- Playwright báo lỗi strict mode khi action/assertion single-element được dùng trên locator có nhiều node.
- Error mẫu:
  - `... resolved to 7 elements ...`

### Vì sao xảy ra

- Playwright `Locator` được thiết kế là lazy query có thể match 1 hoặc nhiều element.
- Sai khi nhầm tưởng như Selenium `findElement` chỉ trả đúng 1.
- Những API như `click`, `fill`, `textContent`, `inputValue`, `getAttribute` cần context là 1 element.

### Cách giải quyết (theo case thực tế)

1. Bắt 1 row trước khi verify.

```ts
const rows = leavePage.getPage.getByRole('row').filter({ hasText: 'CAN - Vacation' });
await expect(rows).toHaveCount(1); // tránh trùng row

const row = rows.first(); // hoặc .nth(0)
const cells = row.getByRole('cell');
```

`toHaveCount(1)` sẽ fail ngay nếu:
- match = 0 (không tìm thấy row)
- match > 1 (trùng row theo text)

`row = rows.first()` được giữ lại để chuyển ý đồ từ `rows` (list) sang `row` (single) trước khi thao tác tiếp, giúp code dễ đọc khi cần mở rộng điều kiện.
- Phòng khi refactor: sau này ai đó đổi expectation, vẫn an toàn.
- Khóa ranh giới giữa bước “đếm đúng 1 row” và bước “xử lý row”.

### Thêm nhiều điều kiện khi match row

Khi chỉ `hasText: 'CAN - Vacation'` chưa đủ, có thể ghép thêm điều kiện theo chain:

```ts
const rows = leavePage.getPage
  .getByRole('row')
  .filter({ hasText: 'CAN - Vacation' })
  .filter({ hasText: 'Added' })
  .filter({ hasText: '-01-01' })
  .filter({ hasText: '77' });

await expect(rows).toHaveCount(1);
const row = rows.first();
const cells = row.getByRole('cell');
```

Hoặc dùng locator kết hợp scope theo table cụ thể để tránh match nhầm:

```ts
const table = leavePage.getPage.getByRole('table', { name: 'Entitlements' });
const row = table
  .getByRole('row')
  .filter({ hasText: 'CAN - Vacation' })
  .filter({ hasText: 'Added' })
  .filter({ hasText: '77' })
  .first();
```

2. Khi cần kiểm tra nhanh nội dung cả row:

```ts
await expect(cells).toHaveText(['CAN - Vacation', 'Added', '-01-01', '-08-24', '77']);
```

3. Khi cần kiểm tra theo cột:

```ts
await expect(cells.nth(0)).toHaveText('CAN - Vacation');
await expect(cells.nth(1)).toHaveText('Added');
await expect(cells.nth(4)).toHaveText('77');
```

4. Nếu cần so sánh text động và chỉ đọc toàn bộ, dùng:

```ts
const cellValues = await cells.allTextContents();
```

5. Nếu table không dùng `<td>`, đừng dùng `locator('td')`; kiểm tra bằng role `cell` hoặc cấu trúc thực tế (`div role="cell"`).

### Multi-element action nào dùng được trực tiếp

- Dùng được:
  - `count()`
  - `all()`
  - `allTextContents()`
  - `allInnerTexts()`
  - `evaluateAll()`
  - `toHaveCount()`
  - `toHaveText([...])` / `toContainText([...])` cho nhiều expected values
  - `filter(...)`
  - `first()`, `last()`, `nth(i)` để chuyển về single element

- Nên tránh trực tiếp trên multi locator:
  - `click()`
  - `fill()`, `type()`
  - `check()`, `uncheck()`
  - `inputValue()`, `textContent()`, `innerText()`, `getAttribute()`
  - `scrollIntoViewIfNeeded()` khi còn multi

### Rule nhớ nhanh

- Locator có thể là list => trước action single, luôn chọn `.first()`/`.nth(i)`.
- Multi-locator dùng để kiểm kê (count/allText), rồi verify.
- Với table custom (OrangeHRM), nên dựa vào `role="row"`/`role="cell"` thay vì cứng `td` khi DOM là div-based.

## Issue 06: try/catch cho UI optional — khi locator có thể có hoặc không tuỳ scenario

### Bối cảnh

- Một số element trên trang xuất hiện không deterministic, có hoặc không tuỳ scenario:
  - Banner cookie / GDPR (chỉ hiện ở context mới hoặc theo region).
  - Popup khuyến mãi, modal "Bạn có muốn nhận noti?", interstitial ad.
  - Tooltip onboarding cho user lần đầu.
- Nếu hardcode `click()` cho element này → test fail khi element không hiện.
- Nếu bỏ qua hoàn toàn → test fail khi element hiện và che các control khác (banner overlay block click).
- Cần pattern "click nếu có, skip nếu không" mà không làm test flaky.

### Ví dụ thực tế

- Banner cookie Uniqlo:
  - Mỗi Playwright context mới → cookie chưa được set → banner hiện.
  - Khi `headless` chạy nhanh, banner có thể render chậm vài trăm ms sau `domcontentloaded`.
  - Cần auto-dismiss trước khi chạy bất kỳ step nghiệp vụ nào, vì banner overlay che các tab Men/Women/Kids.

### Cách khuyến nghị

1. Wrap `waitFor` + `click` trong try/catch với timeout ngắn (1-3s):

```ts
// base.page.ts
async acceptCookiesIfShown(timeout = 3000): Promise<void> {
  const acceptBtn = this._page.getByRole('button', { name: 'accept all' });
  try {
    await acceptBtn.waitFor({ state: 'visible', timeout });
    await acceptBtn.click();
  } catch {
    // Banner không hiện trong timeout → skip silent, test đi tiếp.
  }
}
```

2. Gọi trong fixture sau navigate để tự áp dụng cho mọi test, không cần lặp code ở từng spec:

```ts
// fixture.ts
appPage: async ({ page }, use) => {
  await page.goto(AppUrl.Default);
  await page.waitForLoadState('domcontentloaded');
  await new BasePage(page).acceptCookiesIfShown();
  await use(page);
},
```

3. Khi DOM đã ổn định và không cần chờ thêm, có thể thay try/catch bằng API non-throwing:

```ts
// count() — trả về số lượng, không throw
if (await acceptBtn.count() > 0) {
  await acceptBtn.click();
}

// isVisible() — trả về boolean ngay, không chờ
if (await acceptBtn.isVisible()) {
  await acceptBtn.click();
}
```

So sánh nhanh:

| Pattern | Có chờ? | Phù hợp khi |
|---|---|---|
| `try/catch` quanh `waitFor` | Có (timeout) | Element render chậm, lazy load, animation |
| `if (await el.isVisible())` | Không | DOM đã ổn định, check tức thì |
| `if (await el.count() > 0)` | Không | Cần biết tồn tại trong DOM (kể cả hidden) |

### Anti-pattern (KHÔNG dùng try/catch để)

1. Che lỗi assertion thật → test luôn pass dù feature hỏng:

```ts
// ❌ SAI
try {
  await expect(homePage.btnMen).toBeVisible();
} catch {}
```

2. "Retry" element flaky → nên fix bằng `waitFor` đúng state, không nuốt lỗi:

```ts
// ❌ SAI — che bug timing
try { await btn.click(); } catch { await btn.click(); }
```

3. Thay cho việc chọn locator đúng → khi selector sai mà banner vẫn hiện thật, test sẽ fail ở step sau với lỗi khó hiểu kiểu `element is intercepted by another element` hoặc `timeout waiting for click`. Lỗi xa nguồn gốc → khó debug.

### Mẹo phòng thủ khi selector có thể đổi

- Log nhẹ trong catch để debug nhanh khi selector lỗi thời:

```ts
} catch {
  console.log('[cookie] banner not dismissed (not shown OR selector outdated)');
}
```

- Dùng regex để chịu được nhiều biến thể text:

```ts
const acceptBtn = this._page
  .getByRole('button', { name: /accept all|agree|got it/i })
  .first();
```

- Verify selector lần đầu bằng `npx playwright codegen <url>` rồi mới đưa vào code.

### Quy tắc nhớ nhanh

- try/catch chỉ dùng cho **UI optional** (xuất hiện không deterministic).
- Câu hỏi tự kiểm tra mỗi khi định viết try/catch:
  > "Nếu element này KHÔNG có, test có nên pass không?"
  - Có → try/catch hoặc `isVisible()` / `count()` check.
  - Không → để nó throw, đừng catch.
- Selector phải đúng ngay từ đầu — try/catch không cứu được khi selector sai mà element vẫn tồn tại trên DOM.
- Khi nuốt lỗi, để lại log/comment giải thích lý do để người sau không tưởng đây là bug bị che.
