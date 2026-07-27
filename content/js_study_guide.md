# JavaScript Study Guide for QA Automation

> Mục tiêu: ôn JS đủ sâu để pass interview QA Automation (Middle).
> Format mỗi topic: **Mental Model → Code (Playwright/TS context) → Interview Q&A → Output-Prediction Quiz → Gotcha**.
> Strategy: code-first, predict trước khi run, focus vào pitfall mà interviewer thực sự hỏi.

---

## TIER 1 — Critical (must master)

---

## A. Async / Promise / `await`

### Mental model

JavaScript là **single-threaded** với **event loop**. "Async" KHÔNG phải multi-thread — là cách lên lịch task tới lượt qua **task queues**.

- **Call stack:** chỗ code đang chạy.
- **Microtask queue:** Promise callbacks, `queueMicrotask`. Ưu tiên CAO.
- **Macrotask queue:** `setTimeout`, I/O, UI render. Ưu tiên THẤP hơn.

Event loop: chạy task hiện tại → flush HẾT microtask queue → chạy 1 macrotask → flush microtask → lặp.

`Promise` có 3 state: `pending` → `fulfilled` hoặc `rejected`. `await` **pause execution của async function** cho đến khi promise settle, KHÔNG block main thread.

> [!IMPORTANT]
> `async function` LUÔN return Promise. Return `42` → Promise resolved 42. Throw → Promise rejected.

### Code (Playwright context)

```ts
// ❌ Forgot await — test pass nhưng KHÔNG verify
test('flaky', async ({ page }) => {
  page.click('button');                  // dangling promise
  expect(page).toHaveURL('/done');       // race condition
});

// ✅ Correct
test('correct', async ({ page }) => {
  await page.click('button');
  await expect(page).toHaveURL('/done');
});

// Parallel — 3 API call cùng lúc, tổng time = max thay vì sum
const [users, products, orders] = await Promise.all([
  api.users.list(),
  api.products.list(),
  api.orders.list(),
]);

// Sequential — phải dùng khi step sau cần data của step trước
for (const id of orderIds) {
  await api.orders.refund(id);  // tránh refund cùng lúc gây race condition
}

// allSettled — không bao giờ throw, useful khi muốn xem từng cái thắng/thua
const results = await Promise.allSettled(orderIds.map((id) => api.orders.refund(id)));
const failed = results.filter((r) => r.status === 'rejected');
```

### Interview Q&A

**Q1: `Promise.all` vs `Promise.allSettled` vs `Promise.race`?**

- `all`: 1 reject → toàn bộ reject NGAY. Resolved → array kết quả.
- `allSettled`: chờ TẤT CẢ settle (kể cả fail). Return `[{status, value}|{status, reason}]`. Không bao giờ reject.
- `race`: trả về promise đầu tiên settle (resolve hoặc reject).
- `any` (ES2021): trả về promise đầu tiên RESOLVE (bỏ qua reject). Reject chỉ khi tất cả fail.

**Q2: Microtask vs macrotask?**

Microtask (Promise) chạy NGAY khi task hiện tại xong, TRƯỚC macrotask kế tiếp. Macrotask = `setTimeout`/`setInterval`/I/O. Đây là lý do `setTimeout(fn, 0)` không phải chạy ngay — phải chờ microtask queue rỗng.

**Q3: Khác biệt `await Promise.all([a(), b()])` vs `await a(); await b();`?**

`Promise.all`: parallel, tổng time = `max(a, b)`. Sequential: tổng = `a + b`. Chỉ dùng sequential khi step sau **phụ thuộc** data của step trước.

**Q4: Tại sao `forEach` KHÔNG hoạt động đúng với `async`?**

```ts
[1, 2, 3].forEach(async (id) => {
  await api.delete(id);  // forEach không await callback → loop trả về NGAY
});
// → các delete chạy song song, không control được thứ tự
```

Dùng `for...of` (sequential) hoặc `Promise.all(arr.map(...))` (parallel).

**Q5: `async function` return gì?**

LUÔN Promise. `return 42` → `Promise.resolve(42)`. `throw new Error()` → `Promise.reject(err)`.

### Output-Prediction Quiz

```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);
```

<details><summary>Answer</summary>

**Output:** `1, 4, 3, 2`

Sync code chạy trước (1, 4). Microtask (Promise.then → 3) chạy sau khi stack rỗng. Macrotask (setTimeout → 2) cuối cùng.

</details>

```js
async function foo() {
  return 42;
}
console.log(foo());
```

<details><summary>Answer</summary>

**Output:** `Promise { 42 }` — KHÔNG phải 42. Phải `await foo()` hoặc `foo().then(console.log)` để lấy giá trị.

</details>

```js
async function test() {
  console.log('A');
  await Promise.resolve();
  console.log('B');
}
console.log('1');
test();
console.log('2');
```

<details><summary>Answer</summary>

**Output:** `1, A, 2, B`

`test()` chạy đồng bộ đến `await` → log A → trả Promise (chưa resolve) → quay lại sync → log 2. Sau microtask, tiếp tục → log B.

</details>

### Gotcha

> [!GOTCHA]
> Quên `await` = test xanh giả. Đáng sợ nhất vì test pass nhưng KHÔNG verify gì.

> [!GOTCHA]
> `setTimeout(fn, 0)` KHÔNG chạy "ngay lập tức". Phải đợi microtask queue rỗng. Nếu có nhiều `.then()`, chúng chạy hết rồi mới đến `setTimeout`.

> [!TIP]
> Dấu hiệu code có vấn đề async: thấy promise nhưng không có `await` hay `.then`/`.catch`. → ESLint rule `no-floating-promises` bắt được.

---

## B. Closures & Scopes

### Mental model

**Closure** = function + lexical environment mà nó được tạo ra. Function "nhớ" được biến từ scope ngoài kể cả khi scope đó đã chấm dứt.

**Lexical scope** = scope được xác định bởi vị trí code (nơi function được VIẾT), không phải nơi nó được GỌI.

`var` có function scope, `let/const` có block scope. Đây là lý do `var` trong loop tạo bug kinh điển.

### Code

```ts
// Counter pattern — kinh điển closure
function createCounter() {
  let count = 0;
  return {
    inc: () => ++count,
    get: () => count,
  };
}
const c = createCounter();
c.inc(); c.inc();
console.log(c.get()); // 2 — count "sống" qua closure

// Playwright fixture dùng closure để hold context
export const test = base.extend({
  authedPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: '.auth/user.json' });
    const page = await ctx.newPage();
    await use(page);           // function callback bên ngoài "thấy" ctx, page nhờ closure
    await ctx.close();         // teardown cùng scope → sạch
  },
});

// var trong loop — classic bug
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);  // 3, 3, 3 — tất cả share cùng i
}

// let — block scope mới mỗi iteration
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);  // 0, 1, 2 ✓
}
```

### Interview Q&A

**Q1: Closure là gì? Cho ví dụ?**

Function "ôm" được biến từ scope cha kể cả khi cha đã return. Ví dụ counter pattern (xem code trên). Trong Playwright, fixture dùng closure để giữ context giữa setup và teardown.

**Q2: Tại sao `var` trong loop với `setTimeout` in ra số cuối cùng?**

`var` có **function scope** — chỉ 1 biến `i` duy nhất. Khi setTimeout chạy (sau loop xong), `i` đã là 3. Dùng `let` để mỗi iteration tạo binding mới.

**Q3: Khác nhau giữa `let` và `var`?**

| | `var` | `let`/`const` |
|---|---|---|
| Scope | Function | Block (`{}`) |
| Hoisting | Có, init `undefined` | Có nhưng TDZ → ReferenceError |
| Redeclare | Cho phép | Lỗi |

**Q4: Closure có gây memory leak không?**

Có thể. Closure giữ reference tới biến ngoài → biến không được GC. Ví dụ: callback đăng ký event listener "ôm" DOM node lớn → DOM leak. Cách tránh: cleanup listener, nullify reference khi không cần.

**Q5: Tại sao closure quan trọng trong test fixture?**

Fixture cần share state giữa setup và teardown, hoặc giữa setup và test callback. Closure là cơ chế tự nhiên: function setup capture biến local → callback teardown access cùng biến đó.

### Output-Prediction Quiz

```js
function outer() {
  let x = 10;
  return function inner() {
    console.log(x);
  };
}
const fn = outer();
fn();
```

<details><summary>Answer</summary>

**Output:** `10`. Inner ôm `x` qua closure, dù `outer` đã return.

</details>

```js
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns.map(f => f()));
```

<details><summary>Answer</summary>

**Output:** `[3, 3, 3]`. Mọi function share cùng `i` (function scope). Sau loop, `i = 3`.

</details>

```js
function makeAdders() {
  const adders = [];
  for (let i = 1; i <= 3; i++) {
    adders.push((x) => x + i);
  }
  return adders;
}
const [a1, a2, a3] = makeAdders();
console.log(a1(10), a2(10), a3(10));
```

<details><summary>Answer</summary>

**Output:** `11 12 13`. `let` tạo binding mới mỗi vòng → mỗi adder "ôm" `i` riêng.

</details>

### Gotcha

> [!GOTCHA]
> `var` + loop + async callback = bug kinh điển. Phải dùng `let` hoặc IIFE.

> [!GOTCHA]
> Closure giữ TẤT CẢ biến trong scope, không chỉ biến được dùng. Có thể gây memory leak nếu scope chứa object lớn.

---

## C. `this` binding

### Mental model

`this` được resolve **tại thời điểm GỌI function** (run-time), KHÔNG phải khi viết. Trừ **arrow function** — `this` capture từ scope cha (lexical, giống closure).

5 cách bind `this`:

| # | Cách gọi | `this` là gì |
|---|---|---|
| 1 | `fn()` (default) | `undefined` (strict) hoặc `globalThis` |
| 2 | `obj.fn()` (method) | `obj` |
| 3 | `fn.call(x)`, `fn.apply(x, [...])`, `fn.bind(x)()` | `x` |
| 4 | `new Fn()` | object mới |
| 5 | Arrow `() => this` | `this` của scope viết |

### Code (Playwright Page Object)

```ts
// ✅ Standard Page Object — method là regular function
class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');  // this = HomePage instance ✓
  }
}
const home = new HomePage(page);
await home.goto();  // OK

// ❌ Tách method ra khỏi object → mất this
const goto = home.goto;
await goto();  // TypeError: Cannot read 'page' of undefined

// ✅ Fix với bind
const goto2 = home.goto.bind(home);
await goto2();

// ❌ Arrow trong class method — captures wrong this khi callback từ ngoài
class Page {
  fields = ['a', 'b'];
  async log() {
    setTimeout(function () {
      console.log(this.fields);  // undefined — this là Timeout object/global
    }, 100);
  }
}

// ✅ Dùng arrow để giữ this
class PageOK {
  fields = ['a', 'b'];
  async log() {
    setTimeout(() => {
      console.log(this.fields);  // ['a', 'b'] ✓
    }, 100);
  }
}
```

### Interview Q&A

**Q1: 5 cách bind `this` là gì?**

Default (undefined/global), implicit (obj.method), explicit (call/apply/bind), `new`, arrow (lexical). Xem bảng mental model.

**Q2: Sự khác biệt giữa arrow function và regular function?**

- Arrow: KHÔNG có own `this`, `arguments`, không dùng làm constructor (`new` lỗi), không hoist.
- Regular: có own `this` (xác định lúc gọi), có `arguments`, dùng được làm constructor.

**Q3: Khi nào KHÔNG nên dùng arrow function?**

- Method của class/object cần `this` reference object (nếu dùng arrow trong field initializer thì OK, nhưng method definition thì regular).
- Constructor.
- Function cần `arguments`.
- Event handler cần `this = element`.

**Q4: `bind`, `call`, `apply` khác nhau?**

- `call(thisArg, a, b, c)` — gọi ngay, args truyền riêng.
- `apply(thisArg, [a, b, c])` — gọi ngay, args truyền array.
- `bind(thisArg, a, b)` — trả về function mới đã bind, KHÔNG gọi ngay.

**Q5: `new` làm gì khi gọi function?**

1. Tạo object mới `{}`.
2. Set prototype của object = `Fn.prototype`.
3. Gọi `Fn` với `this` = object mới.
4. Nếu `Fn` không return object → return object mới.

### Output-Prediction Quiz

```js
const obj = {
  name: 'Hai',
  greet() { return `Hi ${this.name}`; },
};
const greet = obj.greet;
console.log(greet());
console.log(obj.greet());
console.log(greet.call({ name: 'Anh' }));
```

<details><summary>Answer</summary>

**Output:**
- `Hi undefined` (default binding, strict mode would throw)
- `Hi Hai` (implicit)
- `Hi Anh` (explicit via call)

</details>

```js
class C {
  name = 'C';
  arrow = () => this.name;
  regular() { return this.name; }
}
const c = new C();
const a = c.arrow;
const r = c.regular;
console.log(a());
console.log(r());
```

<details><summary>Answer</summary>

**Output:** `'C'` và `TypeError` (this undefined).

Arrow trong field initializer capture `this` = instance. Regular method mất `this` khi tách.

</details>

### Gotcha

> [!GOTCHA]
> **Arrow trong class METHOD definition** = sai. Đúng là arrow trong field initializer. Vì arrow trong method `class C { arrow = () => {} }` là field, mỗi instance có function mới (tốn RAM). Method thường nên là regular `method() {}` (shared trên prototype).

> [!GOTCHA]
> Truyền method làm callback → mất `this`. Phải `.bind(this)` hoặc wrap arrow `() => obj.method()`.

> [!TIP]
> Trong Playwright Page Object, dùng regular method là chuẩn. Class field method chỉ dùng khi cần stable reference cho event handler.

---

## D. Error handling async

### Mental model

Lỗi trong async code propagate qua **Promise rejection**, không phải throw đồng bộ. `try/catch` với `await` bắt được rejection vì `await` "unwrap" promise — fulfilled trả value, rejected throw.

3 cách bắt lỗi:
- `try/catch` quanh `await`
- `.catch(handler)` ở cuối Promise chain
- Global: `process.on('unhandledRejection')` (Node), `window.onunhandledrejection` (browser)

### Code

```ts
// try/catch với await
test('handles API error', async () => {
  try {
    await api.users.create(invalidData);
    expect.fail('Should throw');
  } catch (err) {
    expect((err as Error).message).toContain('validation');
  }
});

// .catch chain
api.users.create(data)
  .then(handleSuccess)
  .catch(handleError);

// allSettled — không bao giờ throw
const results = await Promise.allSettled(promises);
const errors = results
  .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
  .map((r) => r.reason);

// Retry với backoff
async function retry<T>(fn: () => Promise<T>, max = 3): Promise<T> {
  for (let i = 0; i < max; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === max - 1) throw err;
      await new Promise((r) => setTimeout(r, 2 ** i * 1000));
    }
  }
  throw new Error('unreachable');
}
```

### Interview Q&A

**Q1: `throw` trong `async function` ra sao?**

Tự động convert thành `Promise.reject(err)`. Caller phải `await` hoặc `.catch` để xử lý.

**Q2: Bắt lỗi của `Promise.all` ra sao?**

`Promise.all` reject ngay khi 1 promise reject. `try/catch` quanh `await Promise.all([...])` chỉ bắt được lỗi ĐẦU TIÊN. Muốn biết hết → dùng `allSettled`.

**Q3: Khi nào unhandled rejection xảy ra?**

Promise reject nhưng không có `.catch` hoặc `try/catch`. Node default sẽ warn (Node 15+ sẽ crash). Bug khó debug vì không có stack trace rõ.

**Q4: `try/catch` có bắt được lỗi trong `setTimeout` không?**

KHÔNG. `setTimeout` chạy async ngoài stack. Lỗi trong callback của setTimeout không propagate ra try/catch ngoài. Phải try/catch BÊN TRONG callback.

**Q5: Strategy retry cho test flaky?**

Wrap async call trong retry function với:
- Max attempts (3-5)
- Exponential backoff (1s, 2s, 4s)
- Chỉ retry với lỗi nhất định (network, timeout), không retry assertion fail.

### Output-Prediction Quiz

```js
async function foo() {
  throw new Error('boom');
}
try {
  foo();  // không có await
} catch (e) {
  console.log('caught', e.message);
}
console.log('done');
```

<details><summary>Answer</summary>

**Output:** `done` + UnhandledPromiseRejection warning. `try/catch` KHÔNG bắt được vì không await — promise rejection escape.

</details>

```js
Promise.all([
  Promise.resolve(1),
  Promise.reject('B'),
  Promise.resolve(3),
])
.then((r) => console.log('then', r))
.catch((e) => console.log('catch', e));
```

<details><summary>Answer</summary>

**Output:** `catch B`. Promise thứ 2 reject → toàn bộ `all` reject với reason đó.

</details>

### Gotcha

> [!GOTCHA]
> `try/catch` không await = không bắt được. Phải `try { await foo() } catch`.

> [!GOTCHA]
> `.then(success, failure)` vs `.then(success).catch(failure)` KHÁC NHAU. Form 1: `failure` không bắt được lỗi từ `success`. Form 2: bắt được. Luôn dùng `.catch` cuối chain.

> [!TIP]
> Trong Playwright test, để fail test rõ ràng khi expect throw không xảy ra: `expect.fail('Should have thrown')` sau action.

---

## E. Modules — CJS vs ESM

### Mental model

- **CommonJS (CJS):** `require()`, `module.exports`. Dynamic, runtime resolution. Node truyền thống.
- **ES Modules (ESM):** `import`, `export`. Static, tree-shakable. Chuẩn modern, async.

Trong project automation TS:
- Source dùng ESM syntax (`import`).
- TS compile target tùy `tsconfig.module`: `commonjs` hoặc `esnext`/`nodenext`.
- `package.json` `"type": "module"` → file `.js` được treat là ESM.

### Code

```ts
// Named export
export const USERS = { ... };
export class ProductApi { ... }
import { USERS, ProductApi } from './api';

// Default export (1 per file)
export default class HomePage { ... }
import HomePage from './home.page';

// Re-export (barrel pattern)
// pages/index.ts
export * from './home.page';
export * from './cart.page';

// Dynamic import (async, lazy load)
const { ProductApi } = await import('./product.api');

// CJS (legacy)
const fs = require('fs');
module.exports = { foo, bar };
```

### Interview Q&A

**Q1: ESM vs CJS khác chính chỗ nào?**

- Static (ESM) vs dynamic (CJS): ESM imports phải đặt top-level, biết trước compile time → tree-shake được.
- Async (ESM) vs sync (CJS): `import()` trả Promise; `require` đồng bộ.
- File extension trong path: ESM yêu cầu (`./foo.js`), CJS optional.

**Q2: `import * as X from '...'` vs `import X from '...'`?**

- `* as X` = namespace import, gom all named exports vào X object.
- `X` (default) = chỉ lấy default export.

**Q3: Tại sao `package.json` cần `"type": "module"`?**

Để Node biết file `.js` nên parse là ESM hay CJS. Mặc định là CJS. Với TS thường set `"type": "module"` + tsconfig `"module": "esnext"` cho ESM.

**Q4: Dynamic import (`await import()`) dùng khi nào?**

- Lazy load module nặng.
- Conditional load: `if (env === 'prod') await import('./heavy')`.
- Trong CJS file muốn import ESM module.

### Output-Prediction Quiz

```ts
// foo.ts
export const x = 10;
export const y = 20;
export default function () { return 'default'; }

// bar.ts
import fn, { x, y } from './foo';
console.log(fn(), x, y);
```

<details><summary>Answer</summary>

**Output:** `default 10 20`. `fn` lấy default export, `x` `y` lấy named.

</details>

### Gotcha

> [!GOTCHA]
> Trộn `import` và `require` trong cùng file ESM → lỗi `Cannot use import statement outside a module`. Set `"type": "module"` trong package.json.

> [!GOTCHA]
> Circular dependency giữa 2 module có thể gây import là `undefined` lúc đầu. Tránh bằng cách refactor shared code ra file thứ 3.

---

## TIER 2 — Frequently asked

---

## F. Equality & Type Coercion

### Mental model

- `==` (loose equality): convert type rồi so sánh. Có nhiều quirk.
- `===` (strict equality): so sánh CẢ type + value. **Luôn dùng `===`** (ESLint default).
- **Falsy values** (7 cái): `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`.
- **Truthy:** mọi cái khác (`{}`, `[]`, `"0"`, `"false"` đều truthy!).

### Code

```js
0 == false       // true
'' == false      // true
null == undefined // true (chỉ cặp này, không với 0/'')
[] == false      // true (nightmare)
NaN === NaN      // false! Dùng Number.isNaN()
'5' == 5         // true
'5' === 5        // false
```

### Interview Q&A

**Q1: Tại sao `NaN === NaN` là `false`?**

NaN theo IEEE 754 spec: KHÔNG bằng bất cứ gì, kể cả chính nó. Dùng `Number.isNaN(x)` hoặc `Object.is(x, x)`.

**Q2: `null` vs `undefined`?**

- `undefined`: biến chưa gán, return không có giá trị, missing arg.
- `null`: gán có chủ ý để biểu thị "không có giá trị".
- `typeof null` là `'object'` (lịch sử để lại, không fix vì backward compat).

**Q3: `[] == false`?**

True (😱). Vì `==` coerce: `[]` → `''` → `0`, `false` → `0`. Đây là lý do tránh `==`.

**Q4: Cách check 1 giá trị là "empty"?**

Không có 1 cách duy nhất:
- `value == null` (bắt cả null + undefined)
- `!value` (bắt cả falsy: 0, '', false...)
- `Object.keys(obj).length === 0` (empty object)
- `arr.length === 0` (empty array)

### Output-Prediction Quiz

```js
console.log(0 == '0');
console.log(0 == []);
console.log('0' == []);
```

<details><summary>Answer</summary>

**Output:** `true, true, false`

- `0 == '0'`: '0' → 0 → equal.
- `0 == []`: [] → '' → 0 → equal.
- `'0' == []`: [] → ''. '0' !== ''.

</details>

```js
console.log(null == undefined);
console.log(null === undefined);
console.log(null == 0);
```

<details><summary>Answer</summary>

**Output:** `true, false, false`. `null == undefined` là exception đặc biệt.

</details>

### Gotcha

> [!GOTCHA]
> KHÔNG BAO GIỜ dùng `==`. ESLint `eqeqeq` rule bật mặc định.

> [!GOTCHA]
> `if (x)` với x là số 0 → false (skip block). Nếu muốn check "x exists" mà 0 vẫn valid → `x != null`.

---

## G. Hoisting & TDZ

### Mental model

**Hoisting** = JS engine "đưa" declaration lên đầu scope trước khi chạy code.

| | Hoisted? | Initialized? |
|---|---|---|
| `var` | Yes | `undefined` |
| `let`/`const` | Yes | **TDZ** (Temporal Dead Zone) — ReferenceError nếu access trước declare |
| Function declaration `function foo() {}` | Yes (full) | Body luôn available |
| Function expression `const foo = function() {}` | Hoisted như `const` | TDZ |
| Class | Yes | TDZ |

### Code

```js
console.log(a); // undefined (var hoisted)
var a = 1;

console.log(b); // ReferenceError (TDZ)
let b = 2;

foo();          // OK, function decl hoisted full
function foo() { console.log('hi'); }

bar();          // TypeError: bar is not a function
var bar = function () {};
```

### Interview Q&A

**Q1: TDZ là gì?**

Khoảng từ đầu scope đến dòng `let`/`const` declare. Trong khoảng đó, access biến → ReferenceError. Mục đích: bắt bug "dùng trước khi khai báo".

**Q2: Function declaration vs function expression?**

Declaration: `function foo() {}` — hoist cả body, gọi được trước dòng. Expression: `const foo = function() {}` — hoist như const, TDZ trước dòng gán.

**Q3: `var` ở top-level làm gì?**

Trong Node CJS: gắn vào `global` (cẩn thận!). Trong ESM module: KHÔNG gắn global, scope là module.

### Output-Prediction Quiz

```js
function test() {
  console.log(x);
  var x = 10;
  console.log(x);
}
test();
```

<details><summary>Answer</summary>

**Output:** `undefined`, `10`. `var x` được hoist (init undefined), gán 10 ở dòng sau.

</details>

```js
console.log(typeof a);
console.log(typeof b);
let b = 1;
```

<details><summary>Answer</summary>

**Output:** `undefined` rồi ReferenceError. `typeof` an toàn với biến chưa declare (như `a`), nhưng KHÔNG an toàn với TDZ (như `b`).

</details>

### Gotcha

> [!GOTCHA]
> `typeof` an toàn với biến chưa declare, NHƯNG ném ReferenceError với let/const trong TDZ. Đừng dùng `typeof` để check biến đã được declare.

---

## H. Array methods (map / filter / reduce)

### Mental model

Hầu hết array method **không mutate** (trừ `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`). Return ARRAY MỚI.

| Method | Return | Khi dùng |
|---|---|---|
| `map(fn)` | array same length | transform từng phần tử |
| `filter(fn)` | array ≤ length | giữ phần tử thỏa điều kiện |
| `reduce(fn, init)` | bất kỳ value | gom array thành 1 value |
| `find(fn)` | first match hoặc undefined | tìm 1 phần tử |
| `some(fn)` | boolean | có ÍT NHẤT 1 match? |
| `every(fn)` | boolean | TẤT CẢ match? |
| `flatMap(fn)` | flat 1 level | map rồi flat |
| `forEach(fn)` | undefined | side effect, không return |

### Code

```ts
const users = [
  { id: 1, name: 'A', age: 25, active: true },
  { id: 2, name: 'B', age: 30, active: false },
  { id: 3, name: 'C', age: 35, active: true },
];

// map: transform
const names = users.map((u) => u.name); // ['A', 'B', 'C']

// filter: giữ phần tử
const active = users.filter((u) => u.active); // 2 items

// reduce: gom thành value
const totalAge = users.reduce((sum, u) => sum + u.age, 0); // 90
const byId = users.reduce<Record<number, typeof users[0]>>((acc, u) => {
  acc[u.id] = u;
  return acc;
}, {});

// Chain
const activeNames = users
  .filter((u) => u.active)
  .map((u) => u.name);

// find
const a = users.find((u) => u.name === 'A');

// some / every
users.some((u) => u.age > 30);  // true
users.every((u) => u.active);   // false
```

### Interview Q&A

**Q1: Implement `map` bằng `reduce`?**

```js
const myMap = (arr, fn) =>
  arr.reduce((acc, x, i) => { acc.push(fn(x, i)); return acc; }, []);
```

**Q2: `map` vs `forEach`?**

`map` return array mới, dùng khi cần transform. `forEach` return undefined, dùng cho side effect.

**Q3: `reduce` initial value có quan trọng không?**

Có. Không cung cấp initial → reduce dùng phần tử đầu làm initial, callback bắt đầu từ phần tử thứ 2. Empty array + no initial = TypeError.

**Q4: `flatMap` khác `map().flat()` thế nào?**

`flatMap(fn)` = `map(fn).flat(1)` nhưng làm 1 lượt → hơi nhanh hơn cho array nhỏ. Chỉ flat 1 level.

### Output-Prediction Quiz

```js
const r = [1, 2, 3].reduce((acc, x) => acc + x);
console.log(r);
```

<details><summary>Answer</summary>

**Output:** `6`. Không có initial → start với `acc=1, x=2`, rồi `acc=3, x=3` → 6.

</details>

```js
const r = [[1, 2], [3, 4]].flatMap((arr) => arr.map((x) => x * 2));
console.log(r);
```

<details><summary>Answer</summary>

**Output:** `[2, 4, 6, 8]`. map mỗi sub-array rồi flat.

</details>

### Gotcha

> [!GOTCHA]
> `.sort()` MUTATE array gốc. Muốn không mutate: `[...arr].sort()`.

> [!GOTCHA]
> `.sort()` không tham số → so sánh STRING. `[10, 2, 1].sort()` → `[1, 10, 2]`. Phải `.sort((a, b) => a - b)`.

---

## I. Destructuring, Spread, Rest

### Mental model

- **Destructuring**: extract value từ array/object vào biến.
- **Spread (`...`)** ở vị trí giá trị: "rải" array/object ra.
- **Rest (`...`)** ở vị trí khai báo: "gom" args vào array.

### Code

```ts
// Object destructure + default + rename
const user = { id: 1, name: 'Hai', email: 'h@x.com' };
const { name, email: userEmail, age = 0 } = user;
// name='Hai', userEmail='h@x.com', age=0

// Array destructure + skip
const [first, , third] = [1, 2, 3];

// Nested
const { address: { city } } = { address: { city: 'HN' } };

// Rest in destructure
const { id, ...rest } = user;  // id=1, rest={name, email}

// Spread (clone shallow)
const cloned = { ...user, name: 'Anh' };  // override name
const merged = [...arr1, ...arr2];

// Rest in function param
function logAll(first, ...others) { console.log(first, others); }
logAll(1, 2, 3, 4);  // 1, [2, 3, 4]
```

### Interview Q&A

**Q1: Spread vs Rest?**

Cùng cú pháp `...` nhưng vị trí khác nhau:
- Spread = expand: `[...arr]`, `{...obj}`, `fn(...args)`.
- Rest = collect: `const [a, ...rest] = ...`, `function(...args) {}`.

**Q2: `{...obj}` là shallow hay deep clone?**

Shallow. Nested object/array vẫn share reference. Deep clone: `structuredClone(obj)` (ES2022) hoặc `JSON.parse(JSON.stringify(obj))` (mất Date, function...).

**Q3: Destructure default value khi nào áp dụng?**

CHỈ khi giá trị là `undefined`. `null` không trigger default.

```js
const { x = 10 } = { x: undefined };  // x = 10
const { x = 10 } = { x: null };       // x = null
```

**Q4: Spread vs Object.assign?**

`{...a, ...b}` ~ `Object.assign({}, a, b)`. Spread mới hơn, syntax gọn hơn. Object.assign mutate target nếu target không phải `{}`.

### Output-Prediction Quiz

```js
const { a = 1, b = 2 } = { a: undefined, b: null };
console.log(a, b);
```

<details><summary>Answer</summary>

**Output:** `1 null`. Default chỉ áp dụng với undefined.

</details>

```js
const arr = [1, 2, 3];
const [head, ...tail] = arr;
console.log(head, tail);
```

<details><summary>Answer</summary>

**Output:** `1 [2, 3]`.

</details>

### Gotcha

> [!GOTCHA]
> Spread của object KHÔNG copy non-enumerable properties (như getter trong class). Dùng `Object.assign` cẩn thận, hoặc clone qua cách khác.

---

## J. Prototype & Class

### Mental model

JS dùng **prototypal inheritance**, không phải classical. Mỗi object có `__proto__` trỏ tới object cha. Khi access property: lookup trên object → nếu không có thì lên `__proto__` → cứ thế đến `null`.

`class` ES6 là **syntactic sugar** cho prototype + constructor function. Bên trong vẫn là prototype chain.

### Code

```js
// Prototype manual
const animal = { eat() { console.log('eating'); } };
const dog = Object.create(animal);
dog.bark = function () { console.log('woof'); };
dog.eat();   // 'eating' — qua prototype chain
dog.bark();  // 'woof'

// Class
class Animal {
  constructor(name) { this.name = name; }
  eat() { console.log(`${this.name} eating`); }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);  // BẮT BUỘC trước khi dùng this
    this.breed = breed;
  }
  bark() { console.log('woof'); }
}

const d = new Dog('Rex', 'Husky');
d.eat();  // 'Rex eating'
d.bark(); // 'woof'
d instanceof Dog;     // true
d instanceof Animal;  // true
```

### Interview Q&A

**Q1: `class` trong JS có phải class thật?**

Không hẳn. Là sugar cho prototype-based inheritance. Behind the scenes: `class Dog extends Animal` = `Dog.prototype.__proto__ = Animal.prototype`. Method định nghĩa trong class gắn lên prototype.

**Q2: `instanceof` hoạt động thế nào?**

Walk prototype chain của object, check có chạm `Constructor.prototype` không.

**Q3: `super()` làm gì?**

Trong constructor: gọi parent constructor. BẮT BUỘC gọi trước khi access `this` trong subclass constructor. Trong method: gọi method cha.

**Q4: Static method là gì?**

Method gắn lên class chính, không phải instance. `class Foo { static bar() {} }` → gọi `Foo.bar()`, không phải `new Foo().bar()`. Dùng cho factory, utility.

### Output-Prediction Quiz

```js
class A { greet() { return 'A'; } }
class B extends A { greet() { return super.greet() + 'B'; } }
console.log(new B().greet());
```

<details><summary>Answer</summary>

**Output:** `'AB'`. `super.greet()` gọi method của A.

</details>

```js
class C {}
const c = new C();
console.log(c.__proto__ === C.prototype);
console.log(C.prototype.constructor === C);
```

<details><summary>Answer</summary>

**Output:** `true true`. Instance `__proto__` = class prototype; class prototype `.constructor` trỏ về class.

</details>

### Gotcha

> [!GOTCHA]
> Trong subclass constructor, dùng `this` trước `super()` → ReferenceError.

> [!GOTCHA]
> Arrow function trong class body là **field**, không phải method trên prototype. Mỗi instance có function riêng → tốn RAM nếu nhiều instance.

---

## S. OOP — Object-Oriented Programming in JS/TS

### Mental model

4 trụ OOP:

| Pillar | Tinh thần | TS construct |
|---|---|---|
| **Encapsulation** | Đóng gói data + behavior, ẩn detail | `private`, `protected`, `#field` |
| **Inheritance** | Subclass kế thừa từ superclass | `extends`, `super` |
| **Polymorphism** | Cùng interface, behavior khác nhau | Method override, interface |
| **Abstraction** | Lộ ra "what", giấu "how" | `abstract class`, `interface` |

### Code (Page Object refactor — minh hoạ 4 pillars)

```ts
// ABSTRACTION + ENCAPSULATION via abstract class + protected
abstract class BasePage {
  protected readonly page: Page;        // encapsulation: protected, không public

  constructor(page: Page) {
    this.page = page;
  }

  abstract get url(): string;            // abstraction: subclass MUST implement

  async goto(): Promise<void> {          // shared behavior
    await this.page.goto(this.url);
    await this.waitForReady();
  }

  protected async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }
}

// INHERITANCE
class HomePage extends BasePage {
  get url() { return '/'; }              // implement abstract
  async search(query: string) {
    await this.page.fill('[data-testid="search"]', query);
  }
}

// POLYMORPHISM — cùng interface, behavior khác
class CartPage extends BasePage {
  get url() { return '/cart'; }
  async waitForReady() {                 // override
    await super.waitForReady();
    await this.page.waitForSelector('[data-testid="cart-loaded"]');
  }
}

// Sử dụng polymorphism
async function navigate(p: BasePage) {
  await p.goto();  // gọi đúng waitForReady của subclass
}
```

### TS Access Modifiers

| Modifier | Truy cập từ |
|---|---|
| `public` (default) | Mọi nơi |
| `protected` | Trong class + subclass |
| `private` (TS) | Trong class duy nhất — TS check, runtime KHÔNG enforce |
| `#field` (JS) | Trong class duy nhất — runtime ENFORCE |
| `readonly` | Read-only sau init |

### Composition vs Inheritance

> [!IMPORTANT]
> **"Favor composition over inheritance"** — nguyên tắc kinh điển. Inheritance tạo coupling chặt, khó refactor. Composition linh hoạt hơn.

```ts
// ❌ Inheritance — chain dài, rigid
class A { ... }
class B extends A { ... }
class C extends B { ... }  // C couple với cả A và B

// ✅ Composition — A "has-a" relationship
class C {
  constructor(
    private logger: Logger,    // C "has" Logger
    private api: ApiClient,    // C "has" ApiClient
  ) {}
}
```

Trong Playwright: **fixture pattern = composition**. Test "has-a" page, "has-a" api — chứ không phải "is-a".

### SOLID briefly

| | Tên | Tinh thần |
|---|---|---|
| **S** | Single Responsibility | 1 class = 1 lý do thay đổi |
| **O** | Open / Closed | Open for extension, closed for modification |
| **L** | Liskov Substitution | Subclass thay được superclass mà không phá behavior |
| **I** | Interface Segregation | Nhiều interface nhỏ > 1 interface to |
| **D** | Dependency Inversion | Depend on abstraction, không phải concrete class |

### Interview Q&A

**Q1: 4 pillars OOP là gì?**

Encapsulation (đóng gói), Inheritance (kế thừa), Polymorphism (đa hình), Abstraction (trừu tượng). Xem bảng mental model.

**Q2: `abstract class` vs `interface` trong TS?**

| | abstract class | interface |
|---|---|---|
| Có implementation? | Có (method có body, abstract method thì không) | Không (chỉ contract) |
| Multiple inheritance? | Không (extends 1 abstract) | Có (implements nhiều interface) |
| Runtime presence? | Có (compiled to JS class) | Không (erased) |
| Khi nào dùng | Share code + bắt buộc implement vài method | Define contract pure, không có code chung |

**Q3: Composition vs inheritance — chọn cái nào?**

Mặc định **composition**. Inheritance khi:
- Có "is-a" relationship rõ ràng (Dog is-a Animal).
- Cần override behavior từ parent.
- Hierarchy không quá 2-3 level.

Tránh inheritance khi:
- Chỉ để reuse code (dùng composition + delegate).
- Subclass phá Liskov (cần override để DISABLE parent method).

**Q4: Liskov Substitution Principle (LSP) là gì?**

Object của subclass phải thay thế được object của superclass mà không phá behavior. Vi phạm thường thấy: `Square extends Rectangle` — setting `width` đổi cả `height` → phá behavior Rectangle.

**Q5: Tại sao Page Object Model là OOP?**

POM áp dụng cả 4 pillars:
- **Encapsulation**: locator + action gói trong class.
- **Inheritance**: `BasePage` → `HomePage`, `CartPage`.
- **Polymorphism**: override `waitForReady` cho page có async load đặc biệt.
- **Abstraction**: `BasePage` abstract method `url`, subclass implement.

### Output-Prediction Quiz

```ts
class A {
  greet() { return 'A'; }
}
class B extends A {
  greet() { return super.greet() + 'B'; }
}
class C extends B {
  greet() { return super.greet() + 'C'; }
}
console.log(new C().greet());
```

<details><summary>Answer</summary>

**Output:** `'ABC'`. Mỗi class call super, build chuỗi A → AB → ABC.

</details>

```ts
class Counter {
  #count = 0;
  inc() { this.#count++; }
  get value() { return this.#count; }
}
const c = new Counter();
c.inc(); c.inc();
console.log(c.value);
// console.log(c.#count); // gì xảy ra?
```

<details><summary>Answer</summary>

**Output:** `2` cho `c.value`. `c.#count` → SyntaxError runtime (private field không access ngoài class).

</details>

### Gotcha

> [!GOTCHA]
> TS `private` KHÔNG enforce runtime — chỉ TS check compile time. Code JS chạy vẫn access được. Dùng `#field` (private hash) để runtime enforce thật.

> [!GOTCHA]
> Deep inheritance chain (4-5 level) là code smell. Refactor sang composition.

> [!GOTCHA]
> Quên gọi `super()` trong subclass constructor (extends) → ReferenceError khi access `this`.

> [!TIP]
> Khi không chắc dùng abstract class hay interface: interface trước (purer, ít coupling). Abstract class chỉ khi cần SHARED CODE thật sự.

---

## TIER 3 — Advanced (gap từ interview feedback)

> [!IMPORTANT]
> Phần này bù đắp đúng các điểm interviewer đánh rớt: **Promise methods đầy đủ, event loop sâu, deep/shallow copy, function expressions, TypeScript syntax, coding tasks**. Mỗi phần có **"Nó là gì → Thành phần/Phương thức → Ví dụ"**.

---

## K. Promise — full method reference

### Nó là gì

`Promise` là object đại diện cho **kết quả tương lai** của một tác vụ bất đồng bộ. Nó có 3 state:

- `pending` — chưa xong.
- `fulfilled` — xong, có `value`.
- `rejected` — lỗi, có `reason`.

Khi đã rời `pending` thì **settled** (không đổi state nữa). Promise giải quyết "callback hell" bằng cách cho chain phẳng (`.then().then()`) và `async/await`.

### Thành phần / phương thức

**A. Static combinators (gộp nhiều promise):**

| Method | Settle khi | Trả về | Reject khi |
|---|---|---|---|
| `Promise.all([])` | TẤT CẢ fulfilled | array values (đúng thứ tự) | promise ĐẦU TIÊN reject (fail-fast) |
| `Promise.allSettled([])` | TẤT CẢ settled | `[{status,value}|{status,reason}]` | KHÔNG BAO GIỜ reject |
| `Promise.race([])` | promise đầu tiên SETTLE | value/reason của cái đó | nếu cái đầu tiên là reject |
| `Promise.any([])` | promise đầu tiên FULFILL | value đầu tiên | chỉ khi TẤT CẢ reject → `AggregateError` |

**B. Static creators:**

- `Promise.resolve(v)` — promise fulfilled sẵn (nếu `v` là thenable thì "theo" nó).
- `Promise.reject(e)` — promise rejected sẵn.
- `Promise.withResolvers()` (ES2024) — trả `{promise, resolve, reject}` để resolve từ ngoài.

**C. Instance methods (chain):**

- `.then(onFulfilled, onRejected)` — chạy khi settle, **trả promise mới** (chainable).
- `.catch(onRejected)` = `.then(undefined, onRejected)`.
- `.finally(fn)` — chạy dù fulfill hay reject, KHÔNG nhận value, KHÔNG đổi value (cleanup).

### Code

```ts
// all — fail-fast, dùng khi cần TẤT CẢ thành công
const [u, p, o] = await Promise.all([api.users(), api.products(), api.orders()]);

// allSettled — vẫn cần biết cái nào fail (vd refund nhiều order)
const results = await Promise.allSettled(ids.map((id) => api.refund(id)));
const ok = results.filter((r) => r.status === 'fulfilled');
const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason);

// race — timeout pattern kinh điển
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms),
  );
  return Promise.race([p, timeout]);   // cái nào xong trước thắng
}

// any — lấy server nào trả lời nhanh nhất, bỏ qua server lỗi
const fastest = await Promise.any([fetch(mirror1), fetch(mirror2), fetch(mirror3)]);

// withResolvers — resolve từ event bên ngoài
const { promise, resolve } = Promise.withResolvers<string>();
socket.on('message', (msg) => resolve(msg));
const firstMessage = await promise;

// .finally — cleanup chạy dù pass/fail
async function load() {
  showSpinner();
  try {
    return await api.fetch();
  } finally {
    hideSpinner();   // luôn chạy
  }
}
```

### Interview Q&A

**Q1: `all` vs `allSettled` vs `race` vs `any` — chọn khi nào?**

- `all`: cần TẤT CẢ thành công, fail 1 cái là bỏ hết (vd load 3 phần data bắt buộc).
- `allSettled`: muốn biết kết quả từng cái, không bỏ cuộc giữa chừng (vd batch job, report).
- `race`: lấy cái settle đầu tiên — timeout, hoặc "cái nào nhanh nhất".
- `any`: lấy cái **fulfill** đầu tiên — fallback giữa nhiều nguồn, bỏ qua lỗi.

**Q2: `Promise.race` vs `Promise.any` khác gì?**

`race` dừng ở promise **settle** đầu tiên (kể cả reject). `any` bỏ qua reject, chỉ dừng ở **fulfill** đầu tiên; chỉ reject khi tất cả fail (gói lỗi vào `AggregateError`).

**Q3: `.then(f, g)` vs `.then(f).catch(g)`?**

`.then(f, g)`: `g` KHÔNG bắt được lỗi do `f` ném (chúng "song song"). `.then(f).catch(g)`: `g` bắt cả lỗi gốc lẫn lỗi trong `f`. → Luôn ưu tiên `.catch` cuối chain.

**Q4: Một promise có `.then` nhiều lần được không?**

Được. Mỗi `.then` nhận cùng value (promise settle 1 lần, value cache). Khác callback chỉ gọi 1 lần.

**Q5: Promise có cancel được không?**

Không native. Promise settle là settle. Muốn "huỷ" → dùng `AbortController` truyền `signal` vào `fetch`/API, hoặc dùng flag bỏ qua kết quả.

### Output-Prediction Quiz

```js
Promise.race([
  Promise.reject('A'),
  Promise.resolve('B'),
]).then((v) => console.log('then', v), (e) => console.log('catch', e));
```

<details><summary>Answer</summary>

**Output:** `catch A`. `race` lấy promise settle ĐẦU TIÊN — ở đây reject 'A' đứng trước → reject toàn bộ.

</details>

```js
Promise.any([
  Promise.reject('x'),
  Promise.reject('y'),
]).catch((e) => console.log(e.constructor.name, e.errors));
```

<details><summary>Answer</summary>

**Output:** `AggregateError ['x', 'y']`. `any` chỉ reject khi tất cả fail, gói reasons vào `AggregateError.errors`.

</details>

```js
Promise.resolve(1)
  .then((v) => v + 1)
  .then((v) => { throw new Error('boom'); })
  .then((v) => console.log('skipped'))
  .catch((e) => console.log('caught', e.message))
  .finally(() => console.log('done'));
```

<details><summary>Answer</summary>

**Output:** `caught boom` rồi `done`. `.then` thứ 3 bị skip (vì chain đang ở rejected), `.catch` bắt, `.finally` luôn chạy cuối.

</details>

### Gotcha

> [!GOTCHA]
> `Promise.all` **fail-fast**: 1 reject là cả nhóm reject, nhưng các promise khác VẪN chạy tiếp (không bị huỷ) — chỉ là kết quả bị bỏ. Nếu cần biết hết → `allSettled`.

> [!GOTCHA]
> `.finally(fn)` không nhận và không đổi value. `return` trong `finally` bị bỏ qua (trừ khi `throw`).

> [!TIP]
> Pattern timeout = `Promise.race([work, timeoutReject])`. Pattern fallback = `Promise.any([...mirrors])`.

---

## L. Event Loop — deep dive

### Nó là gì

JS là **single-threaded**: 1 call stack, chạy 1 việc tại 1 thời điểm. Event loop là cơ chế điều phối để code async không block thread. Runtime (browser/Node) cung cấp **Web APIs / libuv** chạy việc nền (timer, network, fs), rồi đẩy callback vào các **queue** để event loop nhặt.

### Thành phần

| Thành phần | Vai trò | Ví dụ nguồn |
|---|---|---|
| **Call stack** | Code đang chạy | function call |
| **Web API / libuv** | Việc nền do runtime lo | `setTimeout`, `fetch`, fs |
| **Microtask queue** | Ưu tiên CAO, flush HẾT mỗi vòng | Promise `.then`, `await`, `queueMicrotask`, `MutationObserver` |
| **Macrotask queue** | Ưu tiên thấp, 1 cái/vòng | `setTimeout`, `setInterval`, I/O, message event |

**Thuật toán (1 "tick"):**

1. Lấy 1 macrotask, chạy đến khi stack rỗng.
2. **Flush TOÀN BỘ** microtask queue (microtask sinh microtask cũng chạy hết).
3. (Browser) render nếu cần.
4. Quay lại bước 1.

→ Microtask LUÔN chạy trước macrotask kế tiếp. Đây là điểm interviewer hỏi nhiều nhất.

### Node-specific (bonus)

Node có thêm phases: `timers` → `pending` → `poll` → `check` (`setImmediate`) → `close`. Và 2 microtask đặc biệt: `process.nextTick()` (ưu tiên CAO HƠN cả Promise microtask) chạy trước, rồi đến Promise queue.

### Code / Quiz

```js
console.log('1: sync');

setTimeout(() => console.log('2: timeout (macro)'), 0);

Promise.resolve().then(() => {
  console.log('3: promise (micro)');
  Promise.resolve().then(() => console.log('4: nested micro'));
});

queueMicrotask(() => console.log('5: queueMicrotask'));

console.log('6: sync');
```

<details><summary>Answer</summary>

**Output:** `1`, `6`, `3`, `5`, `4`, `2`

Sync trước (1, 6). Flush microtask: 3 chạy → đăng ký micro 4; 5 chạy; rồi 4 (nested micro vẫn trong cùng flush). Cuối cùng macrotask 2.

</details>

```js
async function a() {
  console.log('A1');
  await b();
  console.log('A2');     // → microtask sau await
}
async function b() { console.log('B'); }
console.log('start');
a();
console.log('end');
```

<details><summary>Answer</summary>

**Output:** `start`, `A1`, `B`, `end`, `A2`.

`a()` chạy sync tới `await b()` → `b` chạy sync in `B`, trả promise → `a` nhường lại main → in `end`. Sau khi stack rỗng, microtask resume `a` → `A2`.

</details>

### Interview Q&A

**Q1: Vì sao `setTimeout(fn, 0)` không chạy "ngay"?** Vì nó là **macrotask** — phải đợi stack rỗng VÀ toàn bộ microtask flush xong mới tới lượt.

**Q2: `await` thực chất làm gì với event loop?** `await x` ~ `Promise.resolve(x).then(rest_of_function)`. Phần code sau `await` được lên lịch là **microtask**, không phải chạy đồng bộ.

**Q3: Vòng `while(true){}` ảnh hưởng event loop?** Block hoàn toàn — stack không bao giờ rỗng → không microtask/macrotask nào chạy, UI freeze. Đây là lý do tránh long sync loop.

> [!GOTCHA]
> Microtask sinh microtask vô tận (`.then` đệ quy) → **đói macrotask**, UI không render. Macrotask thì "công bằng" hơn (1 cái/tick).

> [!KEY]
> Câu thần chú: **"Sync hết → microtask hết → 1 macrotask → lặp."**

---

## M. Deep copy vs Shallow copy

### Nó là gì

- **Shallow copy:** copy 1 tầng. Primitive được copy giá trị; object/array lồng bên trong vẫn **share reference** với bản gốc.
- **Deep copy:** copy đệ quy mọi tầng → bản mới hoàn toàn độc lập.

Lý do quan trọng: sửa nested của bản shallow copy sẽ **vô tình sửa bản gốc** → bug khó tìm, đặc biệt trong test data setup.

### Thành phần / phương thức

| Cách | Loại | Hạn chế |
|---|---|---|
| `{...obj}` / `[...arr]` | Shallow | nested vẫn share |
| `Object.assign({}, obj)` | Shallow | nested vẫn share |
| `arr.slice()` / `arr.concat()` | Shallow | nested vẫn share |
| `structuredClone(obj)` | **Deep** (ES2022/Node 17+) | KHÔNG copy function, không copy prototype/class instance, throw với function |
| `JSON.parse(JSON.stringify(obj))` | **Deep** | mất `Date`→string, `undefined`, function, `Map/Set`, `NaN`→null, lỗi vòng lặp |
| lodash `_.cloneDeep` | **Deep** | cần thư viện, nhưng đầy đủ nhất |

### Code

```ts
const original = {
  name: 'cart',
  items: [{ id: 1, qty: 2 }],
  meta: { createdAt: new Date() },
};

// Shallow — sửa nested ảnh hưởng gốc
const shallow = { ...original };
shallow.items[0].qty = 99;
console.log(original.items[0].qty);   // 99 😱 — share reference!

// Top-level thì độc lập
shallow.name = 'changed';
console.log(original.name);           // 'cart' ✓ (string copy giá trị)

// Deep — hoàn toàn độc lập
const deep = structuredClone(original);
deep.items[0].qty = 5;
console.log(original.items[0].qty);   // 99 (không bị ảnh hưởng) ✓

// JSON deep — mất Date
const jsonClone = JSON.parse(JSON.stringify(original));
console.log(typeof jsonClone.meta.createdAt);  // 'string' (Date đã hỏng!) ⚠️
```

### Interview Q&A

**Q1: `{...obj}` deep hay shallow?** Shallow. Chỉ tầng 1. Nested object/array vẫn chung reference.

**Q2: Cách deep copy chuẩn nhất hiện nay?** `structuredClone()` (built-in, xử lý được `Date`, `Map`, `Set`, vòng lặp). Tránh `JSON.parse(JSON.stringify())` nếu data có `Date`/`undefined`/function.

**Q3: Tại sao test bị "data leak" giữa các test case?** Thường do share 1 object fixture rồi mutate qua shallow copy. Fix: deep clone data trong `beforeEach`, hoặc dùng factory function tạo data mới mỗi lần.

**Q4: `const` có ngăn được mutate object không?** Không. `const` chỉ khoá **rebinding** biến, không freeze nội dung. Muốn immutable nội dung → `Object.freeze(obj)` (shallow freeze).

### Output-Prediction Quiz

```js
const a = { x: 1, nested: { y: 2 } };
const b = { ...a };
b.x = 10;
b.nested.y = 20;
console.log(a.x, a.nested.y);
```

<details><summary>Answer</summary>

**Output:** `1 20`. `x` (primitive) độc lập; `nested` share reference → đổi `b.nested.y` đổi luôn `a`.

</details>

```js
const obj = { d: new Date('2020-01-01') };
const copy = JSON.parse(JSON.stringify(obj));
console.log(obj.d instanceof Date, copy.d instanceof Date);
```

<details><summary>Answer</summary>

**Output:** `true false`. JSON round-trip biến `Date` thành string.

</details>

### Gotcha

> [!GOTCHA]
> `structuredClone` **throw** nếu object chứa function hoặc DOM node. Dùng cho data thuần.

> [!GOTCHA]
> `Object.freeze` là **shallow** — nested object vẫn sửa được. Cần "deep freeze" thủ công (đệ quy) nếu muốn khoá hết.

---

## N. Function expressions & các dạng function

### Nó là gì

JS có nhiều cách định nghĩa function, khác nhau về **hoisting, `this`, tên, và mục đích sử dụng**. Interviewer hay hỏi phân biệt "function declaration vs expression" và arrow.

### Thành phần / các dạng

| Dạng | Cú pháp | Hoisting | own `this`? | `arguments`? | `new`? |
|---|---|---|---|---|---|
| Function declaration | `function f() {}` | Full (gọi trước được) | ✅ | ✅ | ✅ |
| Function expression (anonymous) | `const f = function () {}` | Như `const` (TDZ) | ✅ | ✅ | ✅ |
| Named function expression | `const f = function g() {}` | TDZ; `g` chỉ thấy trong body | ✅ | ✅ | ✅ |
| Arrow function | `const f = () => {}` | TDZ | ❌ (lexical) | ❌ | ❌ |
| Method shorthand | `{ f() {} }` | — | ✅ | ✅ | ❌ |
| IIFE | `(function(){})()` | chạy ngay | ✅ | ✅ | — |
| Generator | `function* g() {}` | Full | ✅ | ✅ | ❌ |
| Async | `async function f() {}` | Full | ✅ | ✅ | ❌ |

### Code

```js
// 1. Declaration — hoisted full, gọi trước khi định nghĩa OK
sayHi();                         // "hi" ✓
function sayHi() { console.log('hi'); }

// 2. Expression — TDZ, gọi trước = lỗi
sayBye();                        // TypeError: sayBye is not a function
var sayBye = function () { console.log('bye'); };

// 3. Named function expression — tên dùng để đệ quy, không leak ra ngoài
const factorial = function fac(n) {
  return n <= 1 ? 1 : n * fac(n - 1);   // 'fac' chỉ thấy bên trong
};
// fac(3) → ReferenceError ngoài scope

// 4. IIFE — tạo scope riêng, tránh ô nhiễm global (pattern cũ trước module)
const counter = (function () {
  let count = 0;                  // private
  return { inc: () => ++count };
})();

// 5. Arrow — không có this riêng, gọn cho callback
const nums = [1, 2, 3].map((n) => n * 2);   // [2, 4, 6]

// 6. Higher-order function — nhận/trả function (nền tảng FP)
const multiplier = (factor) => (n) => n * factor;   // currying
const double = multiplier(2);
double(5);   // 10
```

### Interview Q&A

**Q1: Function declaration vs function expression?** Declaration hoist cả body → gọi trước dòng định nghĩa được. Expression gán cho biến → tuân TDZ/hoisting của `var/let/const`, gọi trước = lỗi. Declaration tốt cho API top-level; expression tốt khi gán có điều kiện / truyền làm giá trị.

**Q2: First-class function nghĩa là gì?** Function trong JS là **giá trị**: gán vào biến, truyền làm tham số, return từ function khác, lưu trong array/object. → Nền tảng cho callback, HOF, closure.

**Q3: Higher-order function (HOF) là gì? Ví dụ?** Function nhận function làm arg HOẶC trả về function. Ví dụ: `map`, `filter`, `reduce`, `setTimeout`, middleware, currying. Cực phổ biến trong test (custom matcher, retry wrapper).

**Q4: IIFE để làm gì (thời module hoá hiện đại)?** Tạo private scope tức thì, tránh biến rò ra global. Trước ESM rất phổ biến; nay ít dùng vì module đã có scope riêng, nhưng vẫn gặp trong code cũ và `(async () => { await ... })()` để chạy async ở top-level CJS.

**Q5: Tại sao arrow không làm method/constructor được?** Arrow không có `this` riêng (lấy lexical), không có `prototype`, không có `arguments` → `new` ném lỗi, và method arrow sẽ trỏ `this` sai (ra scope ngoài thay vì object).

### Output-Prediction Quiz

```js
console.log(typeof foo, typeof bar);
function foo() {}
var bar = function () {};
```

<details><summary>Answer</summary>

**Output:** `function undefined`. `foo` declaration hoist full; `bar` mới chỉ hoist biến `var` = `undefined`.

</details>

```js
const add = (a) => (b) => (c) => a + b + c;
console.log(add(1)(2)(3));
```

<details><summary>Answer</summary>

**Output:** `6`. Curry 3 tầng — mỗi arrow trả arrow nhận arg kế, closure giữ `a`, `b`.

</details>

### Gotcha

> [!GOTCHA]
> `var f = function() {}` bị hoist là `undefined` → gọi trước dòng gán = `TypeError: f is not a function`, KHÁC với declaration.

> [!TIP]
> Async top-level trong file CJS: bọc IIFE → `(async () => { await main(); })();`. Trong ESM có thể `await` thẳng top-level.

---

## O. TypeScript syntax essentials

### Nó là gì

TypeScript = JavaScript + **static type system** (kiểm tra lúc compile, bị **erase** khi chạy). Mục tiêu: bắt bug sớm, autocomplete tốt, code tự document. Trong test automation: type cho API response, fixture, Page Object → đỡ lỗi typo, refactor an toàn.

### Thành phần / cú pháp cốt lõi

**1. Type cơ bản & annotation**
```ts
let count: number = 0;
let name: string = 'Hai';
let active: boolean = true;
let ids: number[] = [1, 2, 3];
let pair: [string, number] = ['age', 30];        // tuple
let anything: unknown;                            // an toàn hơn 'any'
function log(msg: string): void {}
function fail(): never { throw new Error(); }     // không bao giờ return
```

**2. `interface` vs `type`**
```ts
interface User { id: number; name: string; email?: string; }  // ? = optional
type ID = string | number;                        // union — chỉ type làm được
type Point = { x: number; y: number };
// interface: extend được, merge declaration; type: linh hoạt hơn (union, mapped, conditional)
```

**3. Union, intersection, literal, narrowing**
```ts
type Status = 'active' | 'inactive' | 'pending';  // literal union
type Admin = User & { role: 'admin' };            // intersection (gộp)

function area(shape: Circle | Square) {
  if (shape.kind === 'circle') return Math.PI * shape.r ** 2;  // narrowing
  return shape.side ** 2;
}
```

**4. Generics (tái dùng với nhiều type)**
```ts
function first<T>(arr: T[]): T | undefined { return arr[0]; }
const n = first([1, 2, 3]);        // T = number
const s = first(['a', 'b']);       // T = string

interface ApiResponse<T> { data: T; status: number; }
type UserResponse = ApiResponse<User>;

function identity<T extends { id: number }>(x: T): T { return x; }  // constraint
```

**5. Utility types (built-in, hay hỏi)**
```ts
Partial<User>      // tất cả field optional
Required<User>     // tất cả field bắt buộc
Readonly<User>     // tất cả field readonly
Pick<User, 'id' | 'name'>     // chỉ lấy vài field
Omit<User, 'email'>           // bỏ vài field
Record<string, number>        // { [key: string]: number }
ReturnType<typeof fn>         // type trả về của fn
Awaited<Promise<User>>        // unwrap Promise → User
```

**6. Enum & const assertion**
```ts
enum Role { Admin, User, Guest }              // Admin=0, User=1...
enum Color { Red = 'RED', Blue = 'BLUE' }     // string enum
const ROLES = ['admin', 'user'] as const;     // readonly tuple, literal type
type Role2 = typeof ROLES[number];            // 'admin' | 'user'
```

**7. Type guards & assertion**
```ts
function isString(x: unknown): x is string {   // type predicate
  return typeof x === 'string';
}
const el = document.querySelector('input') as HTMLInputElement;  // assertion
const val = data!.value;                       // non-null assertion (cẩn ththận)
```

### Interview Q&A

**Q1: `interface` vs `type` — khác gì, chọn cái nào?**
- `interface`: extend được (`extends`), **declaration merging** (khai báo trùng tên thì gộp), hợp cho shape object/class contract.
- `type`: làm được union/intersection/mapped/conditional, không merge.
- Rule of thumb: object/class dùng `interface`; union/utility/phức tạp dùng `type`. (Nhiều team chọn `type` cho mọi thứ vì nhất quán.)

**Q2: `any` vs `unknown` vs `never`?**
- `any`: tắt type check (nguy hiểm, "thoát" type system).
- `unknown`: an toàn — phải narrow/check trước khi dùng.
- `never`: không có giá trị nào (function throw, hoặc nhánh không thể xảy ra). Dùng cho exhaustiveness check.

**Q3: Generics để làm gì?** Tái dùng logic với nhiều type mà vẫn giữ type safety (không mất type như `any`). Vd `Promise<T>`, `Array<T>`, API client `get<T>(url): Promise<T>`.

**Q4: TS type có tồn tại lúc runtime không?** KHÔNG — bị erase khi compile sang JS. → Không thể `if (x instanceof MyInterface)`. Muốn check runtime phải dùng type guard thủ công hoặc thư viện (zod).

**Q5: `Partial` / `Pick` / `Omit` dùng khi nào?** `Partial` cho update payload (chỉ vài field). `Pick`/`Omit` tạo DTO từ entity lớn (vd `Omit<User, 'password'>` cho response).

### Output-Prediction Quiz

```ts
type T = Pick<{ a: number; b: string; c: boolean }, 'a' | 'c'>;
// T tương đương type gì?
```

<details><summary>Answer</summary>

`{ a: number; c: boolean }`. `Pick` giữ đúng các key được liệt kê.

</details>

```ts
const x: unknown = 'hello';
// console.log(x.toUpperCase());  // ?
```

<details><summary>Answer</summary>

Compile error: `'x' is of type 'unknown'`. Phải narrow trước: `if (typeof x === 'string') x.toUpperCase()`.

</details>

### Gotcha

> [!GOTCHA]
> Type bị **erased** lúc runtime. Validate dữ liệu external (API response) phải dùng runtime validator (zod, ajv) — TS type KHÔNG bảo vệ runtime.

> [!GOTCHA]
> `as` (type assertion) không convert/check gì — chỉ "ép" compiler tin. Ép sai → bug runtime mà compiler im lặng.

> [!TIP]
> Bật `strict: true` trong tsconfig: bắt `null`/`undefined`, `noImplicitAny`... Đây là dấu hiệu codebase chất lượng mà interviewer thích nghe.

---

## P. Coding tasks — bài tập hay gặp

### Nó là gì

Vòng coding của interview QA/SDET thường là bài **nhỏ-vừa**: string/array manipulation, đếm tần suất, debounce/throttle, deep clone, implement Promise helper, hoặc viết 1 hàm test utility. Quan trọng: **nói ra cách nghĩ + edge case + độ phức tạp**, không chỉ ra đáp án.

### Bài mẫu + lời giải

**1. Đếm tần suất (frequency map)**
```ts
function countWords(text: string): Record<string, number> {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, w) => {
      acc[w] = (acc[w] ?? 0) + 1;
      return acc;
    }, {});
}
countWords('a b a c b a');  // { a: 3, b: 2, c: 1 }
```

**2. Reverse / palindrome**
```ts
const reverse = (s: string): string => [...s].reverse().join('');
const isPalindrome = (s: string): boolean => {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === [...clean].reverse().join('');
};
```

**3. Unique / dedupe**
```ts
const unique = <T>(arr: T[]): T[] => [...new Set(arr)];
// dedupe theo key của object:
const uniqueBy = <T>(arr: T[], key: keyof T) =>
  [...new Map(arr.map((x) => [x[key], x])).values()];
```

**4. Group by**
```ts
function groupBy<T>(arr: T[], keyFn: (x: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = keyFn(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}
```

**5. Debounce & Throttle (rất hay hỏi)**
```ts
// Debounce: chỉ chạy SAU khi ngừng gọi 'ms' ms (vd search input)
function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Throttle: chạy tối đa 1 lần mỗi 'ms' (vd scroll handler)
function throttle<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let last = 0;
  return (...args: A) => {
    const now = performance.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}
```

**6. Flatten nested array (đệ quy)**
```ts
function flatten(arr: unknown[]): unknown[] {
  return arr.reduce<unknown[]>(
    (acc, x) => acc.concat(Array.isArray(x) ? flatten(x) : x),
    [],
  );
}
// hoặc built-in: arr.flat(Infinity)
```

**7. Implement `Promise.all` (test hiểu Promise)**
```ts
function promiseAll<T>(promises: Promise<T>[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    let done = 0;
    if (promises.length === 0) return resolve([]);
    promises.forEach((p, i) => {
      Promise.resolve(p).then((val) => {
        results[i] = val;            // giữ đúng thứ tự
        if (++done === promises.length) resolve(results);
      }, reject);                    // reject đầu tiên → reject all
    });
  });
}
```

**8. Sleep / retry (thực dụng cho test)**
```ts
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function retry<T>(fn: () => Promise<T>, max = 3, base = 500): Promise<T> {
  for (let i = 0; i < max; i++) {
    try { return await fn(); }
    catch (e) { if (i === max - 1) throw e; await sleep(base * 2 ** i); }
  }
  throw new Error('unreachable');
}
```

### Interview cách trình bày

> [!KEY]
> Quy trình 4 bước khi làm coding task live:
> 1. **Clarify**: hỏi input/output, edge case (empty? null? duplicate? case-sensitive?).
> 2. **Approach**: nói cách làm + độ phức tạp trước khi gõ ("dùng Set → O(n)").
> 3. **Code**: gõ, vừa gõ vừa giải thích.
> 4. **Test**: chạy thử với 1 happy case + 1 edge case.

### Gotcha

> [!GOTCHA]
> Debounce vs throttle hay bị lẫn: **debounce** = đợi im lặng rồi mới chạy (search). **throttle** = giới hạn tần suất, chạy đều đặn (scroll/resize).

> [!TIP]
> Khi quên syntax, nói "tôi sẽ dùng `Set` để dedupe" — interviewer chấm tư duy, không phải trí nhớ API.

---

## Tổng kết — chiến lược ôn

> [!IMPORTANT]
> Nhóm phải thuộc lòng cho QA Automation interview:
> 1. **Async / Promise / `this`** — bug ở automation thường rooted ở đây. Promise methods (K) + event loop (L) là câu hỏi tủ.
> 2. **Closures + Hoisting + Function forms (N)** — output-prediction trap kinh điển.
> 3. **OOP + POM + Design Patterns/SOLID** — kiến trúc framework xoay quanh (xem thêm category *Design Patterns*).
> 4. **Deep/shallow copy (M) + TypeScript syntax (O)** — gap hay bị hỏi mà dễ trả lời lúng túng.
> 5. **Coding tasks (P)** — luyện debounce/throttle, dedupe, group-by, implement `Promise.all`.

> [!TIP]
> Các category bổ trợ cho gap interview: **Design Patterns** (SOLID/DRY/GoF), **Testing Craft** (BDD, stub/mock, contract testing, code quality), **Git Advanced** (rebase, branching strategy, rescue commands).

> [!TIP]
> Quy trình ôn 1 topic:
> 1. Đọc mental model (5 phút).
> 2. Predict output 3-5 quiz (10 phút).
> 3. Viết code thử (15 phút).
> 4. 1 tuần sau làm lại quiz để chống quên (spaced repetition).

> [!KEY]
> Interview tip: khi bị hỏi câu output-prediction, **nói ra suy luận** thay vì đoán đáp án. "Tôi nghĩ event loop sẽ chạy sync trước, sau đó microtask Promise, cuối cùng setTimeout — output sẽ là..." → interviewer thấy bạn HIỂU, không chỉ memorize.
