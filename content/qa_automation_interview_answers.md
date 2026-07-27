# QA Automation Interview - Answers (Middle Level)

> Đóng vai một Middle QA Automation Engineer chuẩn bị phỏng vấn.
> Format trả lời: **Summary → Giải thích → Ví dụ → Pros & Cons** (nếu áp dụng).

---

## 1. Quality Engineering Mindset

### 1. Shift-left testing là gì? Lợi ích?

**Summary:** Shift-left là việc đưa hoạt động testing và quality assurance về phía sớm của vòng đời phát triển (requirement, design, code) thay vì chỉ test sau khi dev xong.

**Giải thích:** Thay vì QA chỉ tham gia ở giai đoạn cuối, QA tham gia ngay từ requirement review, design review, code review, viết unit/integration test cùng dev. Mục tiêu là phát hiện defect càng sớm càng tốt vì chi phí fix bug tăng theo cấp số nhân khi bug được phát hiện muộn.

**Ví dụ:** Trong sprint planning, QA đặt câu hỏi "Nếu user nhập email không hợp lệ thì sao?" → Dev nhận ra thiếu validation → Fix ngay ở design thay vì sau release.

**Pros:**
- Giảm cost of defect (bug ở production tốn gấp 100x bug ở requirement).
- QA hiểu sâu business → test case chất lượng hơn.
- Tăng collaboration giữa Dev-QA-PO.

**Cons:**
- QA phải có technical skill và domain knowledge tốt.
- Cần buy-in từ team, không phải team nào cũng quen với mindset này.

---

### 2. Testing Pyramid là gì? Vì sao UI test nên ít hơn API test?

**Summary:** Testing Pyramid là mô hình phân tầng test với nhiều unit test ở đáy, ít hơn integration/API test ở giữa, và ít nhất UI/E2E test ở đỉnh.

**Giải thích:** UI test chậm, dễ flaky, khó maintain vì phụ thuộc nhiều yếu tố (network, render, animation). API test nhanh hơn, ổn định hơn, và đa số business logic có thể verify qua API. Unit test là nhanh nhất, isolate được logic.

**Ví dụ:** Một feature "checkout" có thể có 50 unit test (validate price calc), 15 API test (cart, payment, order), 3 E2E test (golden path checkout flow).

**Pros của pyramid:**
- Fast feedback loop.
- Maintenance cost thấp.
- Stable CI pipeline.

**Cons nếu inverted (UI nhiều, unit ít):**
- Pipeline chậm, flaky → mất niềm tin vào automation.

---

### 3. Khi nào nên dùng risk-based testing?

**Summary:** Khi resource (thời gian, người) hạn chế và không thể test 100%, ta ưu tiên test các area có rủi ro cao nhất.

**Giải thích:** Risk = Probability × Impact. Ta liệt kê các feature, đánh giá xác suất lỗi và mức độ ảnh hưởng (revenue, user, compliance), rồi tập trung effort vào high-risk area.

**Ví dụ:** Trước release gấp, ưu tiên test payment (high impact + high probability vì vừa refactor) thay vì test profile avatar upload.

**Pros:** Tối ưu ROI của testing effort.
**Cons:** Có thể miss bug ở low-risk area; cần experience để đánh giá risk chính xác.

---

### 4. Pairwise testing là gì? Khi nào phù hợp?

**Summary:** Pairwise (all-pairs) là kỹ thuật test combinatorial - chỉ cần cover mọi cặp giá trị của 2 input thay vì test toàn bộ tổ hợp.

**Giải thích:** Khi có nhiều input parameter, số lượng combination tăng theo cấp số nhân. Pairwise giảm số test case mà vẫn detect được đa số defect (research cho thấy ~80% bug đến từ tương tác 2 parameter).

**Ví dụ:** Test form có 4 dropdown × 5 option = 625 combination → Dùng pairwise giảm còn ~25 test case.

**Pros:** Giảm số test case mạnh mà vẫn coverage tốt.
**Cons:** Không bắt được bug đến từ tương tác 3+ parameter; cần tool (PICT, Hexawise).

---

### 5. Bug Life Cycle gồm các trạng thái nào?

**Summary:** Vòng đời bug: New → Assigned → Open/In Progress → Fixed → Retest → Verified/Closed (hoặc Reopened nếu fail).

**Giải thích:** Một số trạng thái phụ: Rejected (dev không thừa nhận là bug), Deferred (sẽ fix sau), Duplicate, Won't Fix. QA phải hiểu workflow của team để track đúng.

**Ví dụ trên Jira:**
`To Do → In Progress → Code Review → Ready for QA → In QA → Done` hoặc `Reopened`.

---

### 6. Severity và Priority khác nhau thế nào?

**Summary:** **Severity** = mức độ nghiêm trọng kỹ thuật (impact); **Priority** = mức độ ưu tiên fix (business decision).

**Giải thích:** Severity do QA quyết định dựa trên technical impact. Priority do PO/PM quyết định dựa trên business value.

**Ví dụ:**
- Typo trên homepage: Severity thấp, Priority cao (ảnh hưởng brand image).
- Crash khi user click 1 nút ít dùng: Severity cao, Priority thấp.

---

### 7. Verification vs Validation?

**Summary:** **Verification** = "Are we building the product right?" (đúng spec); **Validation** = "Are we building the right product?" (đúng nhu cầu user).

**Ví dụ:**
- Verification: Review code, unit test, static analysis.
- Validation: UAT, beta testing, user feedback.

---

### 8. Retest vs Regression test?

**Summary:** **Retest** = test lại đúng bug đã fix; **Regression** = test các area liên quan để đảm bảo fix không break gì khác.

**Ví dụ:** Bug login fail trên Safari → Retest: login Safari pass. Regression: test login Chrome/Firefox, logout, forgot password, remember me.

---

### 9. Smoke vs Sanity testing?

**Summary:** **Smoke** = test rộng, nông (build có chạy không?); **Sanity** = test hẹp, sâu (feature mới có work không sau fix?).

**Ví dụ:**
- Smoke: Home page load, login, search work (chạy mỗi build).
- Sanity: Sau khi fix bug discount code, chỉ test feature checkout với coupon.

---

### 10. Vì sao QA nên ownership product quality?

**Summary:** Quality là trách nhiệm của cả team, nhưng QA là người advocate mạnh nhất cho user experience và bảo vệ giá trị sản phẩm.

**Giải thích:** QA có góc nhìn end-user, có data về defect trend, có khả năng phát hiện edge case. Nếu QA chỉ "test theo testcase" mà không own quality, sẽ thiếu critical thinking và miss bug.

**Ví dụ:** QA thấy login flow phức tạp → proactive đề xuất UX cải thiện thay vì chỉ verify "có chạy đúng spec không".

---

### Scenario Questions

### 11. Nếu release gấp và không đủ thời gian regression toàn bộ, bạn ưu tiên test gì?

**Trả lời:**
1. **Critical path:** Login, checkout, payment - các flow ảnh hưởng revenue.
2. **Area vừa thay đổi:** Code mới merge có risk regression cao nhất.
3. **High-traffic features:** Phần lớn user dùng.
4. **Smoke test trên multi-browser/device** thay vì regression full.
5. Communicate rõ với PM về risk được chấp nhận.

**Ví dụ:** Release hotfix payment → Ưu tiên test full payment flow + smoke các flow chính, skip test phần admin dashboard.

---

### 12. Một feature ít dùng nhưng liên quan payment, bạn test ra sao?

**Trả lời:** Dù ít dùng, payment-related thì luôn high severity. Tôi sẽ:
- Test full positive + negative case.
- Test edge case (amount = 0, refund partial, currency conversion).
- Verify với data thật trên staging.
- Check log/audit trail.
- Phối hợp Dev test concurrent scenario.

---

### 13. Nếu production có escaped bug, bạn xử lý thế nào?

**Trả lời:**
1. **Immediate:** Reproduce, đánh giá impact, support team xử lý hotfix.
2. **Root cause analysis:** Vì sao QA miss? Có trong testcase không?
3. **Add regression test** để prevent recurrence.
4. **Post-mortem** không đổ lỗi - cải thiện process.

---

### 14. Team có flaky test rate cao, bạn cải thiện ra sao?

**Trả lời:**
- **Identify pattern:** Flaky do timing? Test data? External dependency?
- **Quarantine** flaky test khỏi pipeline chính, fix dần.
- **Remove hard wait**, dùng auto-wait/explicit wait.
- **Isolate test data** - mỗi test có data riêng.
- **Mock external service** không ổn định.
- Track flakiness rate như một metric.

---

### 15. Nếu PM muốn release dù còn bug medium severity, bạn phản hồi thế nào?

**Trả lời:** Trình bày thẳng thắn:
- Mô tả risk cụ thể (user nào bị ảnh hưởng, tần suất).
- Đề xuất workaround nếu có.
- Cung cấp data để PM ra quyết định (không phải QA approve hay block).
- Document quyết định và follow-up fix trong release sau.

QA không phải gatekeeper duy nhất - QA cung cấp thông tin để stakeholder decide.

---

### Product Quality Metrics

### 16. Defect Density là gì?
**Summary:** Số defect / size of module (thường là KLOC hoặc story point). Đo lường chất lượng tương đối giữa các module.

### 17. Bug Escape Rate phản ánh điều gì?
**Summary:** Tỷ lệ bug lọt ra production / tổng bug. Phản ánh hiệu quả của QA process - escape rate cao = QA miss nhiều hoặc test coverage thấp.

### 18. MTTD và MTTR khác nhau thế nào?
**Summary:** **MTTD** (Mean Time To Detect) = thời gian phát hiện bug từ lúc xảy ra. **MTTR** (Mean Time To Recover/Repair) = thời gian fix xong. MTTD đo monitoring/alerting, MTTR đo incident response.

### 19. Coverage cao có đồng nghĩa quality cao không?
**Trả lời:** Không. Code coverage cao chỉ nói code được execute, không nói assertion có meaningful không. 100% coverage vẫn có thể miss bug nếu test case không cover đúng scenario.

### 20. Rollback frequency cao cho thấy điều gì?
**Trả lời:** Release process có vấn đề: testing chưa đủ, CI/CD chưa stable, hoặc feature flag/canary release chưa được áp dụng.

### 21. Metric nào bạn thấy quan trọng nhất trong QA Automation?
**Trả lời:** Tôi quan tâm nhất **Bug Escape Rate** và **Flaky Test Rate**:
- Escape rate đo hiệu quả thực sự của QA (bắt bug trước khi user thấy).
- Flaky rate đo độ tin cậy của automation - nếu test không tin được thì coverage cao cũng vô nghĩa.

---

### Bổ sung — Severity, Priority & Test Prioritization

### 165. Bạn xác định Severity và Priority như thế nào (quy trình cụ thể)?

**Summary:** **Severity** = mức tác động kỹ thuật của bug lên hệ thống (QA/tech đánh giá); **Priority** = thứ tự cần fix xét theo business (PO/PM quyết). Tôi map bug vào một ma trận **Severity × Priority** để cả team thống nhất cách gán, tránh cảm tính.

**Giải thích — thang đo tôi dùng:**

*Severity:*
- **S1/Critical:** crash, mất data, block toàn bộ flow chính, security hole, không có workaround.
- **S2/Major:** chức năng chính sai nhưng có workaround.
- **S3/Minor:** lỗi cục bộ, UI lệch, ảnh hưởng nhỏ.
- **S4/Trivial:** cosmetic, typo.

*Priority:*
- **P1/Urgent:** fix ngay (hotfix).
- **P2/High:** trong sprint hiện tại.
- **P3/Medium:** sprint tới / backlog gần.
- **P4/Low:** khi rảnh.

**Cách quyết:** Severity dựa trên impact + reproducibility + scope user bị ảnh hưởng + có workaround không. Priority dựa trên business value, tần suất user gặp, thời điểm release, rủi ro pháp lý/brand.

**Ví dụ:**
- Payment tính sai tiền → **S1 + P1**.
- Crash ở màn admin ít dùng, có workaround → **S2 + P3**.
- Typo ở homepage → **S4 nhưng P1** (ảnh hưởng brand, fix nhanh).

> [!GOTCHA]
> High severity ≠ luôn high priority và ngược lại. Dùng rubric để tránh tranh cãi Dev–QA.

### 166. Bạn prioritize các critical test scenario như thế nào?

**Summary:** Dùng **risk-based prioritization**: Risk = Probability(lỗi) × Impact(business). Ưu tiên theo thứ tự: critical business flow → high-traffic → area vừa đổi → tích hợp bên thứ ba → phần còn lại.

**Giải thích — tiêu chí xếp hạng:**
- **Business impact:** flow ảnh hưởng revenue/compliance (login, checkout, payment).
- **Usage frequency:** phần đông user chạm vào.
- **Change risk:** code vừa refactor/merge → khả năng regression cao.
- **Historical defects:** area từng nhiều bug.
- **Complexity & integration:** nhiều dependency, nhiều edge case.
- **Cost of failure:** hậu quả nếu lỗi lọt production.

**Ví dụ:** Sprint có 4 feature, tôi rank: payment refund (impact cao + vừa đổi) > search filter (high traffic) > profile edit > theme toggle. Thời gian regression chỉ đủ top 2 → chạy full, phần còn lại smoke, và communicate rõ risk với PM.

**Pros:** Tối ưu ROI khi thời gian hạn chế.
**Cons:** Có thể miss bug ở low-risk area; cần kinh nghiệm + data để đánh giá risk chính xác.

---

## 2. Web UI Testing

### 22. Vì sao vẫn cần cross-browser testing dù đã có API test?

**Summary:** API test verify backend logic, nhưng rendering, CSS, JS execution khác nhau giữa browser. UI bug chỉ phát hiện qua UI test trên đúng browser.

**Ví dụ:** Flexbox/grid render khác trên Safari; date picker dùng native input behavior khác Chrome vs Firefox.

---

### 23. Khác biệt giữa Chrome, Firefox và Safari testing?

**Trả lời:**
- **Chrome (Chromium):** DevTools mạnh, V8 engine, default cho test.
- **Firefox:** Gecko engine, strict về security/privacy, một số CSS render khác.
- **Safari (WebKit):** Engine riêng, hay có issue về date input, autoplay video, storage policy.

**Lưu ý:** Edge dùng Chromium nên gần Chrome. Safari là browser dễ bug nhất.

---

### 24. Responsive testing là gì?

**Summary:** Test UI hiển thị đúng trên các kích thước màn hình khác nhau (mobile, tablet, desktop).

**Ví dụ:** Test breakpoint 320px (mobile), 768px (tablet), 1024px (desktop), 1440px (large screen). Verify menu collapse, font size, image scaling.

---

### 25. Các issue UI phổ biến bạn từng gặp?

**Trả lời:**
- Element bị che bởi modal/cookie banner.
- Layout shift khi load lazy image.
- Z-index conflict giữa header sticky và dropdown.
- Text overflow tiếng nước ngoài (German dài, Japanese ký tự).
- Hover state không hoạt động trên touch device.
- Animation chưa xong nhưng test đã interact.

---

### 26. Khi nào nên test trên real device thay vì emulator?

**Summary:** Khi feature liên quan đến hardware (camera, GPS, touch gesture, biometric) hoặc khi cần verify performance/network thực.

**Ví dụ:** App e-commerce có barcode scanner → bắt buộc real device. Test giao diện thông thường thì emulator + responsive mode đủ.

---

### 27. Bạn dùng DevTools để debug những gì?

**Trả lời:**
- **Elements:** Inspect DOM, CSS, locator.
- **Network:** API request/response, status code, payload, timing.
- **Console:** JS error, log.
- **Application:** localStorage, cookies, session.
- **Performance:** Profile slow page.
- **Lighthouse:** Audit accessibility, performance.

---

### 28. Làm sao check API request trong browser?

**Trả lời:** DevTools → Network tab → Filter XHR/Fetch → Click request xem Headers, Payload, Response, Timing. Có thể right-click → Copy as cURL để reproduce ngoài browser.

---

### 29. Cách identify failed network request?

**Trả lời:**
- Filter status code 4xx/5xx trong Network tab.
- Check failed (red) request.
- Verify response body có error message gì.
- Check request có bị CORS, timeout, hay block bởi extension không.

---

### 30. Nếu UI bị broken layout, bạn inspect gì đầu tiên?

**Trả lời:**
1. Inspect element xem CSS được apply.
2. Check responsive (viewport size).
3. Check console error (CSS file load fail?).
4. Compare với design (Figma).
5. Check browser version compatibility.

---

### Scenario

### 31. Feature chỉ fail trên Safari, bạn investigate thế nào?

**Trả lời:**
1. Reproduce trên Safari local + Safari iOS.
2. Check console error trên Web Inspector của Safari.
3. So sánh request/response với Chrome.
4. Check CSS có dùng property Safari không support? (ví dụ `gap` cũ).
5. Check JS có dùng API mới chưa được Safari support?
6. Tham khảo caniuse.com.
7. Document và assign Dev với evidence rõ ràng.

---

### 32. Nếu button click không được nhưng locator đúng?

**Trả lời checklist:**
- Element có bị overlay che (modal, cookie banner)?
- Có animation/transition đang chạy?
- Element disabled?
- Iframe? Cần switch context.
- Scroll into view?
- Pointer-events: none?
- Cần dispatch event JS thay vì click DOM?

---

### 33. Làm sao debug intermittent UI issue?

**Trả lời:**
- Enable trace/video recording (Playwright trace viewer).
- Run lặp lại với loop để reproduce.
- Check timing - có race condition giữa render và interaction?
- Check network throttling - flaky do API chậm intermittently?
- Isolate environment (data, parallel test conflict).

---

## 3. API Testing

### 34. GET vs POST vs PUT vs PATCH vs DELETE?

**Summary:**
- **GET:** Lấy resource, idempotent, safe.
- **POST:** Tạo resource mới, NOT idempotent.
- **PUT:** Replace toàn bộ resource, idempotent.
- **PATCH:** Update một phần resource, có thể idempotent.
- **DELETE:** Xóa resource, idempotent.

---

### 35. Idempotency là gì?

**Summary:** Một operation idempotent nếu gọi nhiều lần cho cùng kết quả như gọi 1 lần.

**Ví dụ:** GET /user/1 (luôn trả về user 1) - idempotent. POST /user (mỗi lần tạo 1 user mới) - không idempotent.

**Vì sao quan trọng:** Retry mechanism, network unstable cần idempotent để safe.

---

### 36. Ý nghĩa status code 200, 201, 400, 401, 403, 404, 500, 502?

**Trả lời:**
- **200 OK:** Request thành công.
- **201 Created:** Resource được tạo (thường cho POST).
- **400 Bad Request:** Client gửi request sai format/validation fail.
- **401 Unauthorized:** Chưa authenticate (chưa login).
- **403 Forbidden:** Đã authenticate nhưng không có quyền.
- **404 Not Found:** Resource không tồn tại.
- **500 Internal Server Error:** Server lỗi.
- **502 Bad Gateway:** Gateway/proxy nhận response không hợp lệ từ upstream.

---

### 37. Khi nào dùng PUT thay vì PATCH?

**Trả lời:** Dùng PUT khi muốn replace toàn bộ resource (client gửi full object). Dùng PATCH khi chỉ update vài field.

**Ví dụ:**
- PATCH /user/1 { "email": "new@x.com" } → chỉ update email.
- PUT /user/1 { full user object } → replace toàn bộ.

---

### 38. Positive vs Negative test case?

**Summary:** **Positive** test happy path với input hợp lệ. **Negative** test với input invalid để verify error handling.

**Ví dụ:** Login API.
- Positive: username + password đúng → 200.
- Negative: password sai → 401, username trống → 400, SQL injection → 400 không leak data.

---

### 39. Boundary test cho API là gì?

**Summary:** Test giá trị ở biên (min, max, min-1, max+1) của input.

**Ví dụ:** API tạo user với age 1-120 → test 0, 1, 120, 121, -1, 999.

---

### 40. Edge case examples?

**Trả lời:**
- Empty string, null, undefined.
- Unicode/emoji trong text field.
- Số âm, số 0, số rất lớn.
- Concurrent request (race condition).
- Slow network/timeout.
- Token vừa hết hạn.

---

### 41. Request chaining là gì?

**Summary:** Output của 1 API làm input cho API tiếp theo. Cần thiết khi test workflow multi-step.

**Ví dụ:** POST /login → lấy token → GET /profile dùng token → POST /order với userId từ profile.

---

### 42. Multi-step workflow testing là gì?

**Summary:** Test một business flow đầy đủ qua nhiều API call, verify state ở từng bước.

**Ví dụ:** Đặt hàng: create cart → add item → apply coupon → checkout → payment → verify order status.

---

### 43. Bạn validate API response như thế nào?

**Trả lời:**
- **Status code.**
- **Headers** (Content-Type, Cache-Control, custom headers).
- **Body structure** (schema validation).
- **Body data** (giá trị đúng business logic).
- **Response time** (SLA).
- **Side effect** (DB record, message queue, log).

---

### 44. Schema validation là gì?

**Summary:** Verify response structure khớp với schema định nghĩa (JSON Schema, OpenAPI).

**Ví dụ:** Response phải có field `id` kiểu integer, `email` kiểu string format email, `createdAt` kiểu ISO date.

**Pros:** Bắt được structure change sớm.
**Cons:** Schema phải maintain song song với API.

---

### 45. Business validation khác schema validation thế nào?

**Trả lời:** **Schema** validate STRUCTURE (type, required field). **Business** validate VALUE và LOGIC (giá phải > 0, discount không vượt quá total, status transition hợp lệ).

---

### 46. API Key là gì?

**Summary:** Một token dạng string cấp cho client để authenticate khi gọi API. Thường gửi qua header.

**Pros:** Đơn giản. **Cons:** Không có scope, không expire, nếu leak là toang.

---

### 47. JWT hoạt động thế nào?

**Summary:** JSON Web Token = Header.Payload.Signature (base64). Server sign token bằng secret key. Client gửi token qua header `Authorization: Bearer <token>`. Server verify signature mà không cần lookup DB (stateless).

**Pros:** Stateless, scalable. **Cons:** Khó revoke trước khi expire; payload có thể bị decode (không phải encrypt).

---

### 48. OAuth2 là gì?

**Summary:** Protocol authorization cho third-party access mà không share password. Dùng flow: Authorization Code, Implicit, Client Credentials, Password Grant.

**Ví dụ:** "Login with Google" - app nhận access token từ Google thay vì password của user.

---

### 49. 401 vs 403 khác nhau thế nào?

**Summary:** **401 Unauthorized** = chưa authenticate (chưa biết bạn là ai). **403 Forbidden** = đã authenticate nhưng không có quyền (biết bạn là ai nhưng không cho phép).

---

### 50. Bạn test timeout thế nào?

**Trả lời:**
- Mock slow server (delay response).
- Sử dụng tool như Toxiproxy, Charles Proxy để simulate.
- Verify client xử lý đúng: retry? show error? cancel request?
- Test boundary của timeout config.

---

### 51. Rate limit testing?

**Trả lời:** Gửi nhiều request vượt threshold, verify:
- Trả 429 Too Many Requests.
- Header `Retry-After` đúng.
- Sau khoảng thời gian, request được phép trở lại.
- Rate limit reset đúng (per minute/hour/day).

---

### 52. Retry mechanism test ra sao?

**Trả lời:**
- Mock API fail X lần rồi success.
- Verify số lần retry, backoff strategy (exponential/linear).
- Verify không retry với non-idempotent operation hoặc 4xx error.
- Verify max retry không infinite loop.

---

### 53. Nếu API intermittent fail thì debug gì?

**Trả lời:**
- Log full request/response/timing.
- Check load balancer routing - có thể fail chỉ trên 1 instance.
- Check rate limit, throttling.
- Check downstream dependency (DB, cache, external service).
- Check resource (CPU, memory, connection pool).
- Reproduce với high concurrency.

---

### Scenario

### 54. API trả 200 nhưng business logic sai, bạn xử lý sao?

**Trả lời:** 200 chỉ nói "request đến server và xử lý xong", không nói "đúng kết quả".
- Log evidence (request, response, expected).
- Verify với DB/log.
- Báo Dev với reproduction steps.
- Add business assertion vào test thay vì chỉ check status code.

---

### 55. Làm sao verify data consistency giữa APIs?

**Trả lời:**
- Tạo data ở API A, đọc ở API B verify match.
- Test eventual consistency với polling/retry.
- Test concurrent update.
- Verify cross-service data (orderId trong order service = orderId trong payment service).

---

### 56. Nếu login API pass nhưng UI login fail?

**Trả lời checklist:**
- UI có gọi đúng API không? (Check Network tab)
- Response có được handle đúng? (Token được lưu chưa?)
- CORS issue?
- Cookie/storage setting (SameSite, Secure)?
- Có middleware (CAPTCHA, MFA) trên UI mà API skip?

---

## 4. Microservices Testing

### 57. Khó khăn khi test microservices?

**Trả lời:**
- Nhiều service dependency, hard to setup full environment.
- Async communication (message queue) khó verify.
- Distributed tracing phức tạp.
- Test data consistency giữa các service.
- Version compatibility giữa services.
- Network failure giữa services.

---

### 58. Service dependency là gì?

**Summary:** Service A cần gọi Service B để hoạt động. Test A bị block nếu B không sẵn sàng → cần mock hoặc contract test.

---

### 59. Mocking dùng khi nào?

**Trả lời:**
- Service dependency chưa sẵn sàng.
- Test edge case khó reproduce với real service (error 500, timeout).
- Test isolation - chỉ test logic của service hiện tại.
- Test với data deterministic.

**Cons:** Mock có thể drift khỏi real service → cần kết hợp contract test.

---

### 60. Contract testing là gì?

**Summary:** Verify rằng request/response giữa producer và consumer khớp với một "contract" định nghĩa trước. Tool: Pact, Spring Cloud Contract.

**Pros:** Phát hiện breaking change giữa services mà không cần deploy đầy đủ.

---

### 61. Consumer-driven contract là gì?

**Summary:** Consumer định nghĩa contract (mong đợi gì từ producer). Producer phải đảm bảo response thỏa mãn contract.

**Ví dụ:** Frontend (consumer) define "API user phải có field email" → Backend (producer) verify mỗi build có giữ field này không.

---

### 62. Nếu downstream service down thì test gì?

**Trả lời:**
- Service hiện tại có handle gracefully? (Circuit breaker, fallback).
- Error message rõ ràng?
- Có retry không?
- Có cascade failure không?
- Logging/alerting có trigger?

---

### 63. Response time validation là gì?

**Summary:** Verify API response trong SLA (ví dụ < 200ms p95). Là một dạng performance check trong functional test.

---

### 64. Performance awareness trong QA là gì?

**Trả lời:** QA không chỉ test "có chạy đúng" mà còn aware "có chạy nhanh không". Quan sát response time, page load, query DB chậm và raise concern, không cần là performance engineer chuyên sâu.

---

### Scenario

### 65. Một service unstable làm automation fail liên tục, bạn xử lý thế nào?

**Trả lời:**
- Mock service đó tạm thời để không block pipeline.
- Tag test phụ thuộc service đó, skip trong main pipeline, chạy riêng nightly.
- Raise concern với owning team, track stability metric.
- Add retry với backoff cho test phụ thuộc.

---

### 66. Làm sao isolate issue giữa nhiều services?

**Trả lời:**
- Dùng distributed tracing (Jaeger, Zipkin) trace request qua các service.
- Log correlation ID.
- Test từng service riêng (component test) trước khi test integration.
- Check log từng service tại thời điểm fail.

---

### 67. Nếu environment shared và data conflict?

**Trả lời:**
- Mỗi test tạo data riêng với unique identifier (timestamp, UUID).
- Cleanup data sau test.
- Tag data với test run ID.
- Hoặc isolate environment (Docker, Kubernetes namespace per test run).

---

## 5. Automation Testing

### 68. Framework architecture của bạn gồm gì?

**Trả lời:** Framework dùng Playwright + TypeScript:
- **Page Object Model** (`src/pages/`) - tách UI element và action.
- **Fixtures** (`src/fixtures/`) - setup/teardown reusable.
- **Test data** (`src/data/`) - external data file/config.
- **Utils** (`src/utils/`) - helper (locales, dates, api client).
- **Constants** (`src/config/`) - enum, URL, timeout.
- **Tests** (`tests/`) - chia theo feature/domain.
- **CI config** (Jenkinsfile, GitHub Actions).
- **Reporting** (HTML report, trace, video).

---

### 69. Vì sao cần Page Object Model?

**Summary:** POM tách locator và action khỏi test → maintain dễ, reuse cao, test readable hơn.

**Pros:** Khi UI đổi, chỉ sửa 1 page object thay vì sửa nhiều test.
**Cons:** Overhead khi project nhỏ; risk over-engineering (thừa abstraction).

---

### 70. BasePage dùng để làm gì?

**Summary:** Class cha cho các page, chứa method/utility chung: navigation, wait, screenshot, common element (header, footer).

**Ví dụ:** `goto()`, `waitForPageLoad()`, `clickCookieAccept()`.

---

### 71. Fixture là gì?

**Summary:** Cơ chế cung cấp dependency cho test (page, browser, data, login state) với setup/teardown tự động.

**Ví dụ Playwright:**
```ts
export const test = base.extend<{ homePage: HomePage }>({
  homePage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();
    await use(home);
  }
});
```

**Pros:** Test concise, reusable.

---

### 72. Test data management làm sao?

**Trả lời:**
- Static data: JSON/CSV trong repo (cho test deterministic).
- Dynamic data: generate bằng faker (cho unique data).
- API setup: tạo data qua API trước test (nhanh hơn UI).
- Database seed cho test environment.
- Cleanup sau test.
- Separate data theo environment (dev/staging/prod).

---

### 73. Vì sao hard wait là anti-pattern?

**Trả lời:**
- Slow (luôn chờ full duration dù element ready sớm).
- Flaky (nếu network chậm hơn wait time).
- Không communicate intent (chờ cái gì?).

**Thay thế:** `waitForSelector`, `expect().toBeVisible()`, auto-wait của Playwright.

---

### 74. Locator strategy tốt nhất?

**Trả lời thứ tự ưu tiên:**
1. **User-facing role/text:** `getByRole`, `getByLabel`, `getByText` (Playwright recommend).
2. **Test ID:** `data-testid` (stable, không phụ thuộc UI text).
3. **CSS selector:** stable attribute.
4. **XPath:** chỉ khi không có cách nào khác.

**Tránh:** Locator phụ thuộc vị trí (nth-child), class name auto-generated.

---

### 75. Làm sao design framework scalable?

**Trả lời:**
- Modular: chia theo domain/feature.
- Page Object + Component Object cho element reuse.
- Config-driven (env, browser, timeout).
- Parallel execution support.
- Easy onboarding (README, convention).
- Tagging system cho selective run (smoke, regression).

---

### 76. Maintainability principles?

**Trả lời:**
- DRY (Don't Repeat Yourself).
- Single responsibility per page/test.
- Clear naming convention.
- Avoid magic number/string (dùng constant).
- Code review cho test code như production code.

---

### 77. Reusability strategy?

**Trả lời:**
- Fixture cho setup/teardown common.
- Helper function trong utils.
- Base page cho common page action.
- Composable component object.

---

### 78. Làm sao giảm flaky tests?

**Trả lời:**
- Bỏ hard wait, dùng auto-wait/explicit wait.
- Isolate test data.
- Disable animation trong test (CSS).
- Stable locator.
- Mock unreliable external dependency.
- Retry sparingly (1 retry, không phải workaround).
- Track flakiness metric.

---

### 79. Parallel execution có risk gì?

**Trả lời:**
- Data conflict nếu share state.
- Resource contention (DB connection, browser session).
- Order dependency (nếu test phụ thuộc thứ tự chạy là code smell).
- Hard to debug (log interleave).

**Mitigation:** Test independent, data isolation, sharding.

---

### 80. UI vs API automation?

**Trả lời:**
- **UI:** Test end-user experience, integration full stack. Chậm, flaky, đắt maintain.
- **API:** Test business logic, contract, integration backend. Nhanh, stable, dễ maintain.

**Tỷ lệ lý tưởng:** ~70% API, ~20% integration, ~10% E2E UI.

---

### 81. Khi nào automation không phù hợp?

**Trả lời:**
- Feature đang change quá nhanh (chưa stable).
- One-off test, chạy 1 lần.
- Exploratory testing.
- Visual/UX subjective (cần human eye).
- Cost of automation > value (test rarely).

---

### 82. Vì sao API automation thường preferred hơn UI?

**Trả lời:**
- Nhanh hơn 10-100x.
- Stable hơn (không phụ thuộc render, animation).
- Dễ debug (request/response rõ ràng).
- Đa số business logic ở backend.
- Có thể test trước khi UI sẵn sàng.

---

### Scenario

### 83. Framework chạy rất chậm, optimize sao?

**Trả lời:**
- Tăng parallelism (worker, sharding).
- Reduce setup overhead (reuse browser context, login state).
- API setup thay vì UI navigation.
- Mock heavy external service.
- Disable image/font load nếu không cần.
- Profile để tìm bottleneck test cụ thể.
- Tag và split smoke/regression.

---

### 84. Automation pass local nhưng fail CI?

**Trả lời checklist:**
- Browser version khác?
- Headless vs headed?
- Network/proxy CI khác?
- Resource (CPU/RAM) CI thấp?
- Test data CI khác?
- Race condition do CI chạy parallel?
- Timezone/locale khác?

---

### 85. Nếu locator change liên tục?

**Trả lời:**
- Đề xuất Dev add `data-testid` cho element quan trọng.
- Dùng user-facing locator (role, text) thay vì cấu trúc DOM.
- Centralize locator trong page object để dễ update.
- Review test code khi UI change.

---

### 86. Một test flaky nhưng business critical?

**Trả lời:**
- Không skip - business critical thì phải có cách verify.
- Investigate root cause (không add retry rồi quên).
- Tạm thời: add retry + tag, ưu tiên fix.
- Parallel: cover bằng API/integration test cùng coverage.
- Track stability sau fix.

---

### Bổ sung — Automation Design & Reuse

### 167. Bạn quyết định test case nào nên automate?

**Summary:** Automate case có **ROI cao**: chạy lặp nhiều lần, ổn định, deterministic, giá trị cao (critical/regression). Giữ manual cho exploratory, UX chủ quan, one-off, feature đang đổi nhanh.

**Giải thích — checklist quyết định:**
- **Repetition:** chạy nhiều lần (regression, smoke, multi-data) → automate.
- **Stability:** UI/logic đã ổn định, không đổi liên tục.
- **Business value:** critical path, high risk.
- **Determinism:** kết quả rõ ràng, có oracle để assert.
- **Data-driven:** nhiều biến thể input (boundary, equivalence).
- **Cost/benefit:** `cost_automate < cost_manual × số lần chạy dự kiến`.

**Không automate:** exploratory/ad-hoc, kiểm tra cảm quan UX-visual chủ quan, test chạy 1 lần, feature còn thay đổi hằng ngày, case setup quá đắt so với giá trị.

**Ví dụ:** Login + checkout regression (chạy mỗi build, ổn định) → automate ngay. "Đánh giá màu banner mới có đẹp không" → manual.

> [!TIP]
> Ưu tiên automate ở tầng **API/integration** (nhanh, ổn định) trước **UI E2E** — theo testing pyramid.

### 168. Bạn structure reusable automation code như thế nào?

**Summary:** Kiến trúc phân tầng: **Test layer** (chỉ mô tả kịch bản) → **Page/Component Object** (locator + action) → **Fixtures** (setup/teardown) → **Utils/Helpers** (logic chung) → **Data/Config**. Nguyên tắc: DRY, single responsibility, không để logic lặp trong test.

**Giải thích — các tầng (khớp repo Playwright + TS):**
- `tests/` — đọc như kịch bản, không chứa locator thô.
- `src/pages/` — Page Object; `base.page.ts` chứa action chung (`goto`, `waitForLoad`, cookie accept).
- **Component Object** cho phần tử tái dùng nhiều page (header, modal).
- `src/fixtures/` — Playwright fixtures inject dependency (page đã login, data seed).
- `src/utils/` — helper (locales, date, api client).
- `src/config/` — enum, URL, timeout (tránh magic string).

**Ví dụ:**
```ts
export const test = base.extend<{ home: HomePage }>({
  home: async ({ page }, use) => {
    const h = new HomePage(page);
    await h.goto();
    await use(h);
  },
});
// test chỉ còn:
await home.search('Women');
await expect(home.results).toBeVisible();
```

**Pros:** Sửa UI chỉ đụng 1 page object; test đọc như tài liệu.
**Cons:** Overhead abstraction nếu project nhỏ; nguy cơ over-engineering. Review test code như production code.

### 169. Bạn manage shared functions và test data ra sao?

**Summary:** Shared functions gom vào utils/base/fixtures (một nguồn sự thật). Test data tách khỏi test: static → file JSON/fixture; dynamic → faker/factory; setup qua API thay vì UI; luôn **isolate + cleanup** để chạy parallel an toàn.

**Giải thích:**

*Shared functions:*
- Common action → base page / component.
- Cross-cutting helper (auth, api client, format) → utils.
- Setup/teardown → fixtures.
- Hằng số → config/constants (không hard-code).

*Test data:*
- Deterministic data (assertion cố định) → static file, version cùng repo.
- Unique data (tránh trùng khi parallel) → generate bằng `faker` + prefix/UUID/run-id.
- Tạo data qua **API/DB seed** (nhanh, ổn định hơn tạo qua UI).
- **Isolation:** mỗi test/worker có data riêng; cleanup sau test (hoặc namespace/transaction riêng).
- Tách theo environment (dev/staging); không hard-code secret → dùng env var.

**Ví dụ:** Test đăng ký: `faker` sinh email `qa+<runId>@test.com`; user tạo qua API `POST /users` trong fixture; teardown xóa user. Không dùng chung 1 tài khoản cố định để tránh conflict giữa các worker.

> [!GOTCHA]
> Shared **mutable** data giữa các test là nguồn flaky số 1 khi chạy parallel.

---

## 6. Test Management & Tools

### 87. Workflow bug lifecycle trong Jira?

**Trả lời ví dụ:**
`Backlog → To Do → In Progress → Code Review → Ready for QA → In QA → Done` hoặc `Reopened`. Status như **Won't Fix, Duplicate, Cannot Reproduce** dùng để close non-fix.

---

### 88. Bug report tốt cần gì?

**Trả lời:**
- **Title** rõ ràng, có context.
- **Environment** (browser, OS, version, env).
- **Pre-condition.**
- **Steps to reproduce** (đánh số rõ).
- **Expected vs Actual.**
- **Severity/Priority.**
- **Evidence:** screenshot, video, log, network trace.
- **Reproducibility** (always/intermittent).

---

### 89. TestRail/Zephyr dùng để làm gì?

**Summary:** Test case management tool. Quản lý test case, test plan, test run, traceability với requirement, reporting.

---

### 90. Bạn trace testcase với requirement thế nào?

**Trả lời:** Mỗi test case link tới Jira story/requirement ID. Dùng traceability matrix để đảm bảo mỗi requirement có ít nhất 1 testcase cover.

---

### 91. Git branching cơ bản?

**Trả lời:**
- **main/master:** production-ready code.
- **develop:** integration branch.
- **feature/xxx:** feature branch từ develop.
- **release/xxx:** prepare release.
- **hotfix/xxx:** fix urgent từ main.

Phổ biến: GitFlow, GitHub Flow (đơn giản hơn, chỉ main + feature branch).

---

### 92. Pull Request workflow?

**Trả lời:**
1. Tạo branch từ main.
2. Commit, push.
3. Open PR với description, link Jira.
4. CI chạy auto test.
5. Reviewer review code.
6. Address feedback.
7. Approve → merge (squash/rebase/merge).
8. Delete branch.

---

### Scenario

### 93. Dev reject bug vì "cannot reproduce"?

**Trả lời:**
- Cung cấp đầy đủ environment, version, data.
- Quay video/trace.
- Reproduce cùng Dev qua call.
- Check log/monitoring tại thời điểm bug.
- Nếu intermittent, document tần suất và điều kiện.

---

### 94. Requirement ambiguous, bạn làm gì?

**Trả lời:**
- Clarify với PO/BA ngay, không đoán.
- Document Q&A trong ticket.
- Đề xuất scenario cụ thể để PO confirm.
- Update test case sau khi clarify.

---

### 95. PO muốn close ticket nhưng QA chưa verify?

**Trả lời:** Communicate rõ ràng - QA chưa verify thì không thể đảm bảo. Đề xuất:
- Verify nhanh trong scope nhỏ.
- Nếu PO chấp nhận risk thì document và sign-off rõ ràng.
- Không bao giờ tự pass mà không verify.

---

### Bổ sung — Test Plan, Report, Defect & Test Case Quality

### 170. Một Test Plan nên gồm những gì?

**Summary:** Test Plan mô tả **scope, cách tiếp cận, resource, lịch và tiêu chí** của hoạt động test cho một dự án/release. Tham chiếu IEEE 829 nhưng thực tế tôi giữ gọn, tập trung phần ra quyết định.

**Giải thích — thành phần chính:**
- **Objective / scope:** test cái gì, **không** test cái gì (in/out of scope).
- **Test items / features:** danh sách feature & requirement cần cover.
- **Test approach / strategy:** level (unit/API/E2E), loại test (functional, regression, performance…), manual vs automation.
- **Entry / Exit criteria:** khi nào bắt đầu, khi nào coi là "done".
- **Test environment:** browser/OS/device, data, tài khoản, dependency/mock.
- **Roles & responsibilities:** ai làm gì.
- **Schedule & milestones:** timeline, ước lượng effort.
- **Deliverables:** test case, report, traceability matrix.
- **Risks & mitigation:** rủi ro và phương án.
- **Suspension / resumption criteria:** khi nào dừng test (ví dụ build fail smoke).

**Ví dụ (rút gọn cho 1 sprint):** Scope = checkout + payment; approach = API automation cho business logic + E2E smoke cho happy path; exit = 100% critical case pass, 0 S1/S2 open; env = staging, Chrome/Safari, data seed qua API.

> [!NOTE]
> Với Agile thường dùng bản gọn (test strategy + charter) thay vì test plan dày cộp. Phần giá trị nhất luôn là **scope, entry/exit criteria và risk**.

### 171. Một Test Summary Report (TSR/TCR) nên gồm những gì?

**Summary:** Tổng kết kết quả một chu kỳ test: đã test gì, kết quả ra sao, chất lượng thế nào, còn rủi ro gì — để stakeholder **ra quyết định release**.

**Giải thích — thành phần:**
- **Summary / scope đã test:** feature nào đã cover, môi trường, giai đoạn.
- **Execution metrics:** số case planned/executed/passed/failed/blocked, pass rate.
- **Defect summary:** tổng bug theo severity/priority, open vs closed, defect density, bug escape.
- **Coverage:** requirement coverage (trace matrix), automation coverage.
- **Outstanding risks / known issues:** bug chưa fix + workaround.
- **Exit criteria evaluation:** đạt tiêu chí release chưa.
- **Recommendation:** go / no-go, kèm rủi ro chấp nhận.
- **Đính kèm:** link report chi tiết, trace, evidence.

**Ví dụ:** "142/150 case pass (94.6%), 8 fail đều là known issue P3; 0 S1/S2 open; requirement coverage 100%. Recommend **GO** với 3 minor bug đưa sang sprint sau."

**Pros:** Cho quản lý bức tranh chất lượng khách quan để quyết release.
**Cons:** Chỉ liệt kê số mà thiếu recommendation/risk thì report vô dụng. **TCR** (Test Closure Report) thường thêm phần *lesson learned* & metric cuối dự án.

### 172. Bạn categorize và track defects như thế nào?

**Summary:** Phân loại defect theo nhiều trục (severity, priority, type/root-cause, module, status) và track qua bug tracker (Jira) với workflow rõ ràng + metric để nhìn xu hướng.

**Giải thích — các trục phân loại:**
- **Severity & Priority:** xem câu 165.
- **Type / category:** functional, UI, performance, security, data, integration, config/env.
- **Root cause area:** code, requirement gap, design, test data, environment, third-party.
- **Module / component:** để biết vùng nào nhiều bug.
- **Status:** theo bug life cycle (New → Open → Fixed → Retest → Closed/Reopened).
- **Reproducibility:** always / intermittent.

**Track ra sao:**
- Mỗi bug là 1 ticket đủ steps, evidence, env, link requirement.
- Dùng label/component/epic để nhóm.
- Dashboard theo dõi: open by severity, **aging** (bug tồn lâu), **reopen rate**, defect trend theo sprint, defect density theo module.
- Trace bug ↔ test case ↔ requirement để bổ sung regression test sau fix.

**Ví dụ:** Bug gán `severity=S2, priority=P2, type=functional, component=cart, rootcause=code`. Cuối sprint thấy `cart` chiếm 40% bug → đề xuất tăng test + code review vùng cart.

> [!GOTCHA]
> Phân loại root cause đúng mới cho insight cải tiến process; chỉ đếm số bug thì không phòng ngừa được.

### 173. Điều gì tạo nên một test case tốt?

**Summary:** Test case tốt: **rõ ràng, độc lập, có mục tiêu và expected result cụ thể, verify một điều, tái lặp được và trace về requirement.**

**Giải thích — tiêu chí:**
- **Clear & concise:** title + step rõ, ai đọc cũng chạy được.
- **Single objective:** mỗi case verify 1 hành vi/điều kiện.
- **Precondition & test data cụ thể.**
- **Expected result rõ ràng:** có oracle để pass/fail dứt khoát.
- **Independent & repeatable:** không phụ thuộc case khác, chạy lại cho kết quả nhất định.
- **Traceable:** link tới requirement/story.
- **Prioritized:** gắn mức quan trọng.
- **Maintainable:** dễ update khi requirement đổi.
- **Đúng kỹ thuật thiết kế:** positive + negative + boundary + equivalence partition.

**Ví dụ tốt vs xấu:**
- ❌ Xấu: "Test login" (mơ hồ, không có expected).
- ✅ Tốt: *"TC-Login-03: username hợp lệ + nhập password sai 5 lần liên tiếp → account bị khóa 15 phút, hiện message X"* — có input, điều kiện, expected rõ.

> [!GOTCHA]
> Case quá dài verify nhiều thứ một lúc → khi fail không biết fail chỗ nào. Tách nhỏ.

### 174. Bạn handle defect triage / root cause discussion ra sao?

**Summary:** **Triage** = buổi review định kỳ để QA + Dev + PO/lead cùng xác nhận bug, gán severity/priority, owner và hướng xử lý. **RCA** = truy nguyên nhân gốc để phòng ngừa tái diễn, blameless.

**Giải thích — quy trình:**

*Triage:*
1. Đưa bug đã có evidence + phân loại nháp vào buổi triage.
2. Cả team confirm bug thật/không, dedupe, gán severity + priority + owner.
3. Quyết định: fix now / next sprint / defer / won't fix — dựa business + risk.

*RCA (cho bug nghiêm trọng / escaped bug):*
- Reproduce & xác định điểm hỏng.
- Dùng **5 Whys** truy nguyên nhân gốc (code? requirement gap? test miss? env?).
- Hỏi 2 tầng: *"vì sao có bug?"* và *"vì sao QA miss?"*.
- Action: add regression test, sửa process, cập nhật checklist.
- **Blameless post-mortem** — tập trung vào hệ thống, không cá nhân.

**Ví dụ:** Escaped bug payment. 5 Whys → thiếu test case currency conversion → thiếu vì requirement không nêu → action: bổ sung acceptance criteria + regression test + review requirement kỹ hơn.

> [!GOTCHA]
> Triage mà không gán owner + deadline → bug tồn đọng. RCA mà đổ lỗi cá nhân → lần sau không ai dám báo bug thật.

---

## 7. CI/CD

### 96. CI/CD là gì?

**Summary:** **CI** (Continuous Integration) = merge code thường xuyên + auto build/test. **CD** (Continuous Delivery/Deployment) = auto deploy code đã pass CI lên môi trường (staging/production).

---

### 97. Automation integrate CI/CD ra sao?

**Trả lời:**
- Pre-merge: chạy smoke test trên PR.
- Post-merge: chạy regression trên main.
- Nightly: full regression + cross-browser.
- Pre-deploy: smoke staging.
- Post-deploy: health check production.

**Trong project hiện tại:** Jenkins pipeline chạy Playwright test trong Docker, multi-browser, multi-worker.

---

### 98. Smoke test nên chạy khi nào?

**Trả lời:** Mỗi PR, mỗi deploy. Mục đích là verify nhanh "build có usable không" trước khi đầu tư full regression.

---

### 99. Regression nên chạy khi nào?

**Trả lời:** Sau merge vào main, nightly, hoặc trước release. Không cần chạy mỗi PR vì tốn thời gian.

---

### 100. Vì sao cần parallel execution?

**Trả lời:** Giảm thời gian feedback. 100 test serial 1 phút/test = 100 phút. Parallel 10 worker = 10 phút. Trade-off: cần test independent, infra mạnh hơn.

---

### 101. Bạn dùng reporting tools nào?

**Trả lời:**
- **Playwright HTML report** (built-in).
- **Allure** cho rich report + history.
- **Jenkins/GitHub Actions** dashboard.
- **Slack notification** cho failure.

---

### 102. Trace/video/log giúp gì?

**Trả lời:**
- **Trace** (Playwright): timeline đầy đủ step, DOM snapshot, network → debug post-mortem chính xác.
- **Video:** xem visually test chạy thế nào.
- **Log:** console output, application log.
- Đặc biệt giá trị khi test fail trên CI mà không reproduce được local.

---

### 103. Test reporting quan trọng thế nào?

**Trả lời:**
- Stakeholder thấy quality status.
- Dev debug fail nhanh.
- Track trend (pass rate, flakiness, duration).
- Audit & compliance.
- Đo lường ROI của automation.

---

### Scenario

### 104. Pipeline fail nhưng local pass?

**Trả lời:** Xem câu 84. Tóm tắt: check env difference (browser, headless, resource, data, network, parallel).

---

### 105. Nightly regression unstable?

**Trả lời:**
- Phân loại fail: real bug vs flaky vs env issue.
- Quarantine flaky.
- Fix env (data isolation, mock dependency).
- Track stability metric, set target (ví dụ ≥95% pass rate).

---

### 106. Flaky tests trong CI xử lý sao?

**Trả lời:** Xem câu 78. Đồng thời:
- Quarantine khỏi pipeline blocking.
- Tag và schedule investigation.
- Không add retry như bandage.

---

### 107. Một failed test có block release không?

**Trả lời:** Tùy:
- Critical path fail → block.
- Flaky/non-critical → investigate, có thể release với risk acceptance.
- Cần communicate rõ với PM/PO về impact.

---

## 8. Communication & Collaboration

### 108. Bạn communicate bug với Dev thế nào?

**Trả lời:**
- Trực tiếp, không vòng vo, không đổ lỗi.
- Mô tả objective (steps, evidence), không phán xét.
- Verbal khi cần demo phức tạp, written để document.
- Suggest possible cause nếu có insight, không áp đặt.

---

### 109. Nếu disagreement với Dev?

**Trả lời:**
- Dựa trên spec/requirement, không cảm tính.
- Đưa data, không đưa opinion.
- Nếu spec ambiguous → escalate PO/BA decide.
- Respect expertise của nhau.

---

### 110. Làm sao clarify requirement ambiguity?

**Trả lời:**
- Đặt câu hỏi cụ thể, đưa scenario.
- Confirm written trong ticket.
- Triple-check edge case.
- Đề xuất acceptance criteria rõ ràng.

---

### 111. Nếu designer và PO conflict requirement?

**Trả lời:** QA không tự decide. Setup meeting align - QA đưa ra góc nhìn user và test impact, để stakeholder decide. Document quyết định.

---

### 112. Bạn decide testcase nào automate thế nào?

**Trả lời tiêu chí:**
- High value (critical path, high traffic).
- Stable (UI/logic không thay đổi liên tục).
- Repetitive (regression dùng nhiều lần).
- Có ROI rõ (cost automate < cost manual × số lần chạy).
- Data-driven hoặc có nhiều variant.

**Không automate:** Exploratory, UX subjective, one-off, đang thay đổi nhanh.

---

### Single QA Scenario

### 113. Nếu bạn là QA đầu tiên trong team?

**Trả lời ưu tiên:**
1. Hiểu product, user, business.
2. Setup bug tracking, test case management.
3. Manual smoke test critical path.
4. Risk-based test plan.
5. Bắt đầu automation cho stable area.
6. Build culture quality - involve Dev trong test.

---

### 114. Bạn ưu tiên setup gì trước?

**Trả lời:**
- Bug tracking (Jira).
- Test case management.
- CI integration cơ bản.
- Smoke test automation cho critical path.
- Test environment ổn định.

---

### 115. Metrics nào đo success?

**Trả lời:**
- Bug escape rate (bug lọt production).
- Time to detect (MTTD).
- Automation coverage critical flow.
- Release frequency + rollback rate.
- Team velocity và confidence.

---

### 116. Làm sao convince team invest automation?

**Trả lời:**
- Show data: manual regression mất X giờ, automation chạy Y phút.
- Demo quick win (1 flow automate, chạy CI).
- ROI calculation cho stakeholder.
- Start small, scale dần.

---

## 9. AI Experience

### 117. Bạn dùng AI hỗ trợ QA thế nào?

**Trả lời:**
- Generate test idea, edge case.
- Generate test data (faker prompt).
- Code review test code.
- Generate Playwright/Selenium boilerplate.
- Explain failed test log.
- Document writing.

**Lưu ý:** AI là assistant, không thay thế judgment.

---

### 118. AI có thể giúp generate testcase ra sao?

**Trả lời:**
- Input: requirement/user story → AI suggest positive/negative/edge case.
- Generate boundary value, equivalence partition.
- Suggest test data variation.

**Caveat:** AI không hiểu business context sâu, không biết history bug → cần human review.

---

### 119. Risk của AI-generated tests?

**Trả lời:**
- Hallucinate (locator/API không tồn tại).
- Miss edge case domain-specific.
- Sai assertion (test pass nhưng không meaningful).
- Sai best practice (hard wait, fragile locator).
- False sense of coverage.

---

### 120. Vì sao không nên trust hoàn toàn AI-generated automation?

**Trả lời:** AI không có context đầy đủ về product, user, history bug, infra. Test có thể "có vẻ đúng" nhưng không catch bug thực sự, hoặc thậm chí broken.

---

### 121. Human verification strategy là gì?

**Trả lời:**
- Review code AI generate như review PR.
- Verify locator thực sự tồn tại và stable.
- Verify assertion match business logic.
- Run test, kiểm tra fail message meaningful.
- Compare với existing pattern trong codebase.

---

### Scenario

### 122. AI generate locator sai, xử lý sao?

**Trả lời:**
- Inspect DOM thật để verify locator.
- Update bằng locator stable (data-testid, role).
- Feedback context tốt hơn cho AI (provide HTML snippet).

---

### 123. AI-generated testcase miss edge case?

**Trả lời:** AI giỏi happy path, yếu edge case domain-specific. QA phải supplement bằng:
- Negative case từ requirement.
- Historical bug pattern.
- Boundary và state transition.

---

### 124. Bạn validate AI output thế nào?

**Trả lời:**
- Run thử (smoke).
- Code review.
- Compare expected vs actual của AI.
- Check best practice violation.
- Peer review.

---

### 125. AI có thể thay QA không?

**Trả lời:** Không, ít nhất hiện tại. AI thay thế repetitive task, code generation, log analysis. QA judgment - hiểu user, ưu tiên risk, communicate - là human skill. AI là multiplier, không phải replacement.

---

## Bonus: Framework Comparison & Playwright Weaknesses

### B1. Có những framework nào để test automation cho UI và API?

#### UI Automation Frameworks

| Framework | Ngôn ngữ | Pros (so với Playwright) | Cons (so với Playwright) |
|---|---|---|---|
| **Playwright** | TS/JS, Python, Java, .NET | • Auto-wait built-in (ít flaky)<br>• Multi-browser thật (Chromium, Firefox, WebKit) — kể cả Safari<br>• Multi-tab/context isolation tốt<br>• Network interception (`page.route`) mạnh, sẵn API mocking<br>• Trace viewer time-travel debug<br>• Codegen tốt, parallel mặc định | • Trẻ hơn → ít plugin/community so với Selenium<br>• Yêu cầu Node-based mindset cho TS/JS users<br>• Real device mobile yếu hơn Appium |
| **Cypress** | JS/TS | • DX rất tốt, live reload UI<br>• Time-travel debugging trong runner<br>• Doc + community lớn | • **Chỉ chạy trong browser** (cùng tab) → khó test multi-tab, multi-origin (đỡ hơn sau v12 nhưng vẫn hạn chế)<br>• Không hỗ trợ Safari/WebKit native<br>• Chỉ JS/TS<br>• Parallel cần Cypress Cloud (paid)<br>• Iframe/cross-origin lằng nhằng hơn Playwright |
| **Selenium / WebDriver** | Java, Python, JS, C#, Ruby... | • Chuẩn W3C, lâu đời, support đa ngôn ngữ rộng nhất<br>• Grid + cloud (BrowserStack, Sauce) cực mạnh<br>• Hệ sinh thái plugin/integration khổng lồ | • Không auto-wait → dễ flaky, phải tự code wait<br>• Setup nặng (driver binary, version match)<br>• Chậm hơn Playwright/Cypress<br>• Không có network interception native (cần BiDi/CDP add-on)<br>• Debug/trace yếu hơn |
| **Puppeteer** | JS/TS | • Nhẹ, focus vào Chromium<br>• Tốt cho scraping, PDF, screenshot automation<br>• API gần Playwright (cùng founder) | • **Chỉ Chromium** (gần đây có Firefox experimental)<br>• Không phải test framework đầy đủ — phải ghép Jest/Mocha<br>• Không có test runner, parallel, reporter built-in |
| **WebdriverIO** | JS/TS | • Wrap WebDriver + Puppeteer/CDP → linh hoạt<br>• Plugin ecosystem mạnh (Appium tích hợp tốt)<br>• Hỗ trợ mobile + desktop chung framework | • Cấu hình phức tạp hơn Playwright<br>• Stability/performance phụ thuộc backend (WebDriver hay CDP)<br>• Curve học cao hơn |
| **TestCafe** | JS/TS | • Không cần WebDriver, setup zero-config<br>• Smart selector tự retry | • Performance kém Playwright<br>• Community thu hẹp, ít cập nhật<br>• Network mocking yếu hơn |
| **Appium** | Multi | • Test mobile native + hybrid (iOS, Android) — chỗ Playwright YẾU | • Setup nặng (simulator, real device farm)<br>• Chậm, hay flaky<br>• Không dành cho web desktop |
| **Nightwatch.js** | JS/TS | • API đơn giản, end-to-end + unit gộp<br>• Hỗ trợ cả WebDriver lẫn CDP | • Adoption giảm, ít trending<br>• Network mock không bằng Playwright |

#### API Automation Frameworks

| Framework | Ngôn ngữ | Pros (so với Playwright API) | Cons (so với Playwright API) |
|---|---|---|---|
| **Playwright (API mode)** | TS/JS, Python... | • **Cùng framework** test cả UI lẫn API → 1 codebase, 1 reporter, 1 trace<br>• Có thể share auth state UI ↔ API<br>• Request context lightweight, parallel sẵn | • Không chuyên sâu API (không có data-driven runner mạnh, JSON path matcher gọn như Karate)<br>• Schema validation phải tự code (zod/ajv) |
| **Postman / Newman** | GUI + JS | • GUI thân thiện, BA/manual QA cũng dùng được<br>• Collection chia sẻ dễ<br>• Newman chạy được CI | • Test logic viết bằng JS trong GUI → khó version control sạch<br>• Khó tích hợp với UI test<br>• Mock server cơ bản, paid để scale |
| **Rest Assured** | Java | • DSL fluent rất gọn cho REST<br>• Mạnh với Java microservices (Spring)<br>• Schema/JSON path validation built-in | • Chỉ Java<br>• Không kèm UI test → cần ghép Selenium/Playwright Java<br>• Setup Maven/Gradle nặng hơn TS |
| **Karate** | Gherkin-like DSL | • BDD-style, **không cần code** nhiều<br>• Built-in: schema match, JSON path, parallel, perf<br>• Mock server, contract test sẵn | • DSL riêng → khó debug khi logic phức tạp<br>• Không phải Java/JS thuần → khó tái dùng utility<br>• UI test có nhưng yếu (Karate UI dựa Playwright/Selenium) |
| **SuperTest** | JS/TS | • Cực gọn cho test Express/Node app<br>• Test in-process (không cần server chạy) → siêu nhanh | • Chỉ phù hợp Node BE<br>• Không test được UI<br>• Không có data-driven, reporter mạnh |
| **Pytest + requests / httpx** | Python | • Flexible, kết hợp được fixtures Python<br>• Data-driven mạnh với `@parametrize`<br>• Plugin nhiều (pytest-bdd, allure) | • Phải tự build assertion lib<br>• UI integration cần riêng (Playwright Python hoặc Selenium)<br>• Không gọn như Rest Assured/Karate DSL |
| **REST Client / Bruno / Insomnia** | GUI | • Quick exploration, doc API<br>• Bruno: file-based, git-friendly | • Không phải framework automation đầy đủ<br>• Phù hợp exploratory hơn regression CI |
| **K6 (Grafana)** | JS | • Mạnh cho **load/performance** test API<br>• Cú pháp giống JS quen thuộc | • Sinh ra cho perf, không phải functional<br>• Assertion yếu hơn so với pytest/Karate |
| **JMeter** | Java GUI | • Chuẩn industry cho perf<br>• Plugin & report đa dạng | • UI nặng nề, file `.jmx` XML khó maintain<br>• Functional test gượng gạo |
| **Pact** | Multi | • **Contract testing chuyên dụng** cho microservices<br>• Consumer-driven contract chuẩn | • Không phải functional test thuần — bổ trợ chứ không thay |

#### Khi nào chọn cái nào

| Context | Chọn |
|---|---|
| Web app modern (SPA), team JS/TS, cần cả UI + API + cross-browser | **Playwright** (mặc định ngày nay) |
| Team Java, microservices Spring | **Rest Assured + Selenium/Playwright Java** |
| Cần BDD, ít code, full stack BE-heavy | **Karate** |
| Manual QA chuyển dần sang automation | **Postman/Newman → Playwright** |
| Test perf/load API | **K6** (hoặc JMeter nếu enterprise) |
| App mobile native | **Appium** (Playwright KHÔNG làm được) |
| Microservices, sợ contract drift | **Pact** + framework chính ở trên |
| Cypress đã setup sẵn legacy | Giữ Cypress, không migrate nếu không có lý do mạnh |

#### Tại sao Playwright đang trending (điểm chốt khi interview)

- Auto-wait → giảm flaky đáng kể (đau đầu lớn nhất của Selenium).
- Cross-browser THẬT (kể cả WebKit/Safari) — Cypress không có.
- Trace viewer → debug CI fail post-mortem cực mạnh.
- Built-in API testing → 1 framework cho cả 2 layer.
- Network interception (`page.route`) gọn hơn mọi framework khác.

**Câu trả lời ngắn cho interviewer:**
> "Tôi dùng Playwright vì nó cover được cả UI và API trong cùng codebase, auto-wait giúp test stable hơn Selenium, và network mocking ở browser-level mạnh hơn Cypress. Nhưng tôi cũng từng dùng/biết Selenium (legacy, multi-language), Cypress (DX tốt cho dev), Postman (exploratory + manual share), và Rest Assured (cho Java stack). Việc chọn framework phụ thuộc stack team và requirement, không phải framework nào 'tốt nhất'."

---

### B2. Điểm yếu của Playwright là gì?

> Interviewer test xem bạn có **self-awareness** không. Trả lời "Playwright không có điểm yếu" là red flag. Liệt kê thật + mitigation.

#### Nhóm 1 — Phạm vi (cái Playwright KHÔNG làm được)

| Điểm yếu | Giải thích | Workaround |
|---|---|---|
| **Không test mobile native** (iOS/Android app) | Chỉ test web. Mobile chỉ giả lập viewport, không phải OS thật. | Ghép **Appium** cho native, dùng Playwright mobile emulation cho web responsive. |
| **Không intercept được server-side** | `page.route` chỉ chặn ở browser. BE→DB, BE→third-party không với tới. | Mock server-side riêng (WireMock, Toxiproxy). |
| **Visual regression cơ bản** | `toHaveScreenshot` đủ smoke nhưng yếu hơn Applitools/Percy về cross-browser AI diff. | Ghép Applitools/Percy nếu visual là critical. |

#### Nhóm 2 — Hệ sinh thái (so với Selenium)

| Điểm yếu | Giải thích |
|---|---|
| **Trẻ hơn, community nhỏ hơn** | Ít Stack Overflow answer cho edge case enterprise, plugin ít hơn. |
| **Ngôn ngữ hẹp hơn** | TS/JS, Python, Java, .NET — không có Ruby, C++, PHP. Selenium support rộng hơn nhiều. |
| **Tích hợp enterprise tool** (TestRail, Xray, ALM) | Plugin chủ yếu community-maintained, không phải official. |
| **BDD/Cucumber support hạn chế** | Không built-in. Phải tự ghép `@cucumber/cucumber` + custom world. Karate/SpecFlow tích hợp tốt hơn. |

#### Nhóm 3 — DX & vận hành

| Điểm yếu | Giải thích | Workaround |
|---|---|---|
| **DX live-runner không bằng Cypress** | UI Mode đã có nhưng "time-travel feeling" khi viết test Cypress mượt hơn. | Trace Viewer post-mortem là vũ khí riêng — debug CI fail tốt hơn Cypress. |
| **Resource consumption khi parallel cao** | Mỗi worker = 1 browser instance → ngốn RAM/CPU. | Sharding, container tuning. |
| **CI image lớn** | Browser binary Chromium+Firefox+WebKit vài trăm MB. | Dùng image official `mcr.microsoft.com/playwright`, cache layer. |
| **Auth phức tạp (SSO, MFA) vẫn cần workaround** | `storageState` xử lý cookie nhưng MFA OTP, biometric vẫn phải tự code. | API login bypass UI, OTP từ test mailbox. |
| **API testing không chuyên sâu** | Không có data-driven runner mạnh như Karate, schema validation tự code (zod/ajv). | Đủ dùng cho 80% case; cần sâu thì ghép tool API chuyên. |
| **Flaky vẫn xảy ra** | Auto-wait không phải magic — animation phức tạp, race condition vẫn flaky. | Disable animation, isolate test data, dùng `waitFor` chuẩn. |

#### Cách trả lời theo 3 cấp độ

**Cấp 1 — Câu trả lời ngắn, an toàn (~30s):**
> "Playwright mạnh nhưng có vài hạn chế tôi gặp thực tế:
> 1. **Không test được mobile native** — phải dùng Appium song song nếu team có app.
> 2. **Visual regression cơ bản** — phải ghép Applitools hoặc Percy khi cần serious cross-browser visual.
> 3. **Hệ sinh thái còn trẻ hơn Selenium** — đôi khi edge case enterprise phải tự giải thay vì có plugin sẵn.
>
> Nhưng với phạm vi web automation, đa số điểm yếu này có workaround hoặc không phải dealbreaker."

**Cấp 2 — Khi interviewer đào sâu:**
> "Một điểm tinh tế nữa là `page.route()` chỉ intercept ở **tầng browser** — nghĩa là test 500 với mock là test FE xử lý lỗi, không phải test BE xử lý lỗi downstream. Để cover phần đó tôi vẫn cần WireMock hoặc fault injection ở server-side. Đây không phải bug của Playwright mà là **design boundary** — nhưng cần hiểu để không tự lừa mình rằng đã 'cover hết'."

**Cấp 3 — Khi muốn ghi điểm về maturity:**
> "Tôi nghĩ điểm yếu lớn nhất không phải technical mà là **adoption**: trong team mà nhiều người quen Selenium lâu năm, Playwright pattern (locator-first, async/await) cần thời gian onboard. Tôi từng phải viết internal guideline + pair coding để team chuyển. Tool có mạnh đến đâu mà team không dùng đúng thì cũng vô nghĩa."

#### Những gì KHÔNG nên nói

- ❌ "Playwright không có điểm yếu" — interviewer mất niềm tin.
- ❌ "Playwright dở vì XYZ" — không có nuance, mất điểm.
- ❌ Liệt kê 10 điểm yếu một mạch — quá tải, nghe như phàn nàn.
- ❌ Nói weakness mà không kèm mitigation — thiếu pragmatic mindset.

#### Công thức vàng

> **2-3 weakness thật + 1 workaround + 1 câu kết luận "trade-off chấp nhận được vs benefit"**

Ví dụ kết luận:
> "Mỗi tool có boundary của nó. Tôi chọn Playwright vì cover 80% nhu cầu của web app modern, còn 20% còn lại tôi biết khi nào cần ghép tool khác. Việc nhận thức rõ boundary quan trọng hơn việc cố tìm 'silver bullet'."

Câu này gây impression cực tốt với senior interviewer vì show **systems thinking**, không phải tool fanboy.

---

## Bonus: Tech Round Topics (JS Ecosystem)

> 4 chủ đề từ guideline: **Framework Architecture / Dev in JS / API tools in JS / UI tools in JS.**
> Đầu mỗi nhóm có map sang câu cũ; phần dưới là câu mới bổ sung riêng cho JS-ecosystem.

---

### T1. Test Automation Framework Architecture in JS

**Đã có ở section trước:**
- Q68 (architecture overview), Q69-70 (POM, BasePage), Q71 (fixture), Q72 (test data)
- Q73 (hard wait anti-pattern), Q74 (locator strategy)
- Q75-79 (scalable, maintainable, reusable, flaky, parallel)
- B1 (framework comparison)

#### T1.1 — Các loại framework architecture: linear / modular / data-driven / keyword-driven / hybrid / BDD / POM?

**Summary:**
- **Linear (record-replay):** script tuyến tính, không reuse. Phù hợp PoC.
- **Modular:** chia function/module reuse. Maintainable hơn.
- **Data-driven:** logic chung, data tách (CSV/JSON) → 1 test chạy nhiều bộ data.
- **Keyword-driven:** action mã hoá thành "keyword" cho non-coder. Phổ biến với Excel-based tool legacy.
- **Hybrid:** kết hợp data-driven + modular + POM.
- **BDD:** Gherkin Given/When/Then (Cucumber, Karate) — ưu tiên collaboration với business.
- **POM:** design pattern (không phải architecture đầy đủ) — tách UI element khỏi test.

**Hiện tại đa số project JS modern dùng:** Hybrid = POM + fixture (DI) + data-driven (parametrize) + tag.

---

#### T1.2 — Vì sao TypeScript thay vì plain JavaScript cho automation framework?

**Summary:** TS = JS + static type → bắt lỗi compile-time, IDE autocompletion mạnh, refactor an toàn.

**Pros:**
- Type safety cho page object, fixture, response schema.
- Autocompletion: gõ `homePage.btn` → IDE gợi ý đầy đủ.
- Refactor đổi tên field tự động đồng bộ.
- Document tự thân (type là spec).

**Cons:**
- Setup ban đầu (`tsconfig`, type definition).
- Slightly slower (transpile, nhưng không đáng kể).
- Curve học cho QA mới.

**Khi không cần TS:** PoC nhỏ, tester không quen TS, script throwaway.

---

#### T1.3 — `tsconfig` path alias dùng để làm gì?

**Summary:** Map alias (`@pages/*`, `@fixtures/*`) → folder thật, để import gọn và không phụ thuộc đường dẫn tương đối.

**Ví dụ trong project Uniqlo:**
```json
"paths": {
  "@pages/*": ["src/pages/*"],
  "@fixtures/*": ["src/fixtures/*"],
  "@config/*": ["src/config/*"]
}
```
→ `import { HomePage } from '@pages/home.page';` thay vì `'../../../src/pages/home.page'`.

**Pros:** Code clean, dễ refactor folder. **Cons:** Cần config thêm cho runtime (ts-node, Playwright tự hiểu path alias từ tsconfig).

---

#### T1.4 — Cấu trúc folder của một Playwright project chuẩn?

**Trả lời ví dụ (theo project hiện tại):**
```
project-root/
├── src/
│   ├── pages/        # Page Object Model
│   ├── fixtures/     # Test fixtures (DI)
│   ├── utils/        # Helper (locales, dates, ...)
│   └── config/       # Constants, enum, env mapping
├── tests/
│   ├── e2e/          # UI E2E test (chia theo feature)
│   ├── api/          # API test + mock helpers
│   │   ├── fixtures/ # Mock data
│   │   └── helpers/  # Mock server
│   └── auth/         # Auth setup, storage state
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── Jenkinsfile / .github/workflows/
```

**Nguyên tắc:** tách `src` (framework code) ≠ `tests` (test code). Tách theo **domain** (e2e/api/auth) thay vì theo loại file.

---

#### T1.5 — Test runner trong JS: Playwright Test / Jest / Mocha / Vitest — chọn cái nào?

| Runner | Đặc điểm | Khi nào dùng |
|---|---|---|
| **Playwright Test** | Built-in cho Playwright, fixture, parallel, trace | E2E + API trong Playwright |
| **Jest** | Mạnh nhất ecosystem, snapshot, mock built-in | Unit test, BE in-process test |
| **Mocha** | Linh hoạt, BYO assertion (Chai) | Legacy, custom setup |
| **Vitest** | Nhanh, ESM-first, Jest-compatible API | Vite project, unit test modern |

**Quy tắc:** Playwright Test cho automation E2E/API. Jest/Vitest cho unit/component. Không trộn lung tung.

---

#### T1.6 — Quản lý environment (dev/staging/prod) trong framework?

**Trả lời:**
- `.env` file riêng cho mỗi env: `.env.dev`, `.env.staging`, `.env.prod`.
- Load bằng `dotenv` hoặc Playwright `process.env`.
- Config file đọc env và export hằng số: `BASE_URL`, `API_BASE_URL`, `TIMEOUT`.
- CI inject env qua variable secret, không commit credentials.

**Ví dụ:**
```ts
baseURL: process.env.BASE_URL || 'https://www.uniqlo.com/us/en/'
```

---

#### T1.7 — Test tagging/grouping strategy?

**Summary:** Gắn tag (smoke, regression, critical, slow) vào test → chạy chọn lọc theo nhu cầu.

**Ví dụ Playwright:**
```ts
test('login @smoke @critical', async ({ page }) => { ... });
// Chạy: npx playwright test --grep @smoke
```

**Pros:** Pipeline gọn — PR chạy smoke (5 phút), nightly chạy regression (45 phút).

---

#### T1.8 — Khi nào kế thừa (BasePage) vs khi nào composition (helper)?

**Summary:** **Kế thừa** dùng cho cái MỌI page đều có (cookie banner, navigation, locale). **Composition** dùng cho function utility độc lập.

**Ví dụ:**
- BasePage: `acceptCookiesIfShown()`, `t` (locale strings) → kế thừa.
- `formatDate()`, `generateOrderId()` → utility function, import dùng.

**Rule of thumb:** Inheritance "is-a", composition "has-a". Lạm dụng inheritance → fragile.

---

#### T1.9 — Composition của fixtures — extend từ base test thế nào?

**Summary:** Playwright cho `test.extend()` chồng fixture lên fixture base → DI sạch.

**Ví dụ:**
```ts
import { test as base } from '@playwright/test';

export const test = base.extend<{
  homePage: HomePage;
  authedApi: APIRequestContext;
}>({
  homePage: async ({ page }, use) => {
    await page.goto('/');
    await use(new HomePage(page));
  },
  authedApi: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({
      extraHTTPHeaders: { Authorization: `Bearer ${TOKEN}` }
    });
    await use(api);
    await api.dispose();
  },
});
```

**Pros:** Test khai báo `{ homePage, authedApi }` là có ngay, không cần beforeEach lặp.

---

### T2. Test Automation Development in JS Ecosystem

**Đã có:** chưa có question nào riêng cho ecosystem. Mục này hoàn toàn mới.

#### T2.1 — npm vs yarn vs pnpm — khác nhau gì?

| | npm | yarn | pnpm |
|---|---|---|---|
| Install speed | Trung bình | Nhanh hơn | Nhanh nhất |
| Disk space | Nhân bản | Nhân bản | **Symlink** → tiết kiệm |
| Lockfile | `package-lock.json` | `yarn.lock` | `pnpm-lock.yaml` |
| Strict deps | Loose | Loose | **Strict** (chống phantom dep) |

**Khi nào dùng:** npm default đủ tốt. pnpm nếu monorepo / muốn nhanh / strict. yarn nếu legacy team đã dùng.

---

#### T2.2 — `dependencies` vs `devDependencies` vs `peerDependencies`?

**Summary:**
- **dependencies:** package cần ở runtime production.
- **devDependencies:** chỉ cần ở dev/CI (Playwright, ESLint, Prettier, TS).
- **peerDependencies:** package mà host phải cài sẵn (plugin pattern).

**Với automation project:** hầu hết là `devDependencies` (vì không deploy lên production, chỉ chạy ở CI).

---

#### T2.3 — `package-lock.json` để làm gì? Có commit không?

**Summary:** Khoá version chính xác của TẤT CẢ deps (kể cả transitive). **CÓ** commit để mọi người cài giống nhau.

**Vì sao quan trọng:** `package.json` có `"playwright": "^1.40.0"` thì npm có thể cài 1.40.5 hôm nay, 1.42.0 tuần sau → flaky build. Lock file đảm bảo deterministic.

---

#### T2.4 — async / await vs Promise.then — khi nào dùng cái nào?

**Summary:** Cả hai làm cùng việc, nhưng `async/await` đọc tuyến tính hơn → ưu tiên dùng.

**Ví dụ tương đương:**
```ts
// .then chain
fetch('/api').then(r => r.json()).then(data => console.log(data));

// async/await
const r = await fetch('/api');
const data = await r.json();
console.log(data);
```

**Khi vẫn dùng `.then`:** chain ngắn, hoặc `Promise.all([...]).then(...)`.

**Pitfall trong test:** quên `await` → test pass trước khi assertion chạy.

---

#### T2.5 — `Promise.all` vs sequential await — risk gì?

**Summary:**
- **Sequential:** `await a(); await b();` — chạy tuần tự, an toàn về thứ tự.
- **Parallel:** `await Promise.all([a(), b()])` — chạy song song, nhanh hơn.

**Risk Promise.all:**
- Nếu 1 promise reject, toàn bộ fail (dùng `Promise.allSettled` nếu muốn vẫn chờ tất cả).
- Race condition nếu các action chia sẻ state.

**Ví dụ test:**
```ts
// Parallel: tạo 3 user cùng lúc — OK nếu API không conflict
const [u1, u2, u3] = await Promise.all([createUser(), createUser(), createUser()]);
```

---

#### T2.6 — Error handling patterns trong async code?

**Trả lời:**
- `try/catch` quanh `await` block.
- `.catch(handler)` cuối Promise chain.
- Global handler: `process.on('unhandledRejection')`.
- **Trong Playwright:** không cần catch để pass test — fail trên error là đúng. Chỉ catch khi test có nhánh xử lý lỗi (ví dụ click cookie banner nếu hiện).

```ts
async acceptCookiesIfShown() {
  try { await this.btn.click({ timeout: 3000 }); }
  catch { /* banner not shown — skip */ }
}
```

---

#### T2.7 — CommonJS vs ES Modules — khác nhau?

**Summary:**
- **CommonJS (CJS):** `require()`, `module.exports`. Mặc định Node cũ.
- **ES Modules (ESM):** `import`, `export`. Chuẩn JS modern, async, tree-shakable.

**Trong project automation TS:** thường dùng ESM syntax, TS compile thành CJS hoặc ESM theo `tsconfig.module`.

**Pitfall:** trộn import/require → lỗi `Cannot use import outside a module`. Set `"type": "module"` trong package.json để ESM.

---

#### T2.8 — ESLint + Prettier + Husky — vai trò?

**Summary:**
- **ESLint:** lint code, bắt lỗi syntax/anti-pattern (no unused var, no await in loop...).
- **Prettier:** format code consistent (indent, quote, semicolon).
- **Husky:** Git hook — chạy lint/format/test trước commit.
- **lint-staged:** chỉ chạy lint trên file đã stage (nhanh hơn).

**Pros:** Đảm bảo code style đồng nhất, bắt bug sớm. Test code cũng cần lint!

---

#### T2.9 — `dotenv` & quản lý secret?

**Summary:** `dotenv` load biến từ `.env` file vào `process.env`. **Không commit** `.env` chứa secret.

**Pattern:**
- `.env.example` (commit, mô tả biến cần có).
- `.env` (gitignore, chứa secret thật của dev).
- CI: secret được inject qua env variable của CI runner (Jenkins credentials, GitHub Secrets).

```ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const apiKey = process.env.API_KEY;
```

---

#### T2.10 — Debugging Playwright test trong VSCode?

**Trả lời:**
- **Playwright VSCode extension**: chạy/debug test với 1 click, set breakpoint trong .ts.
- **UI Mode:** `npx playwright test --ui` — runner interactive, step-by-step.
- **Inspector:** `PWDEBUG=1 npx playwright test` mở browser + Playwright Inspector.
- **Trace Viewer:** `npx playwright show-trace trace.zip` — post-mortem CI fail.
- `console.log` + `--headed --slowMo=500` cho visual debug.

---

#### T2.11 — TS: `interface` vs `type`?

**Summary:**
- **interface:** declare hợp đồng object, có thể extends, merge declaration.
- **type:** alias cho bất kỳ type nào (union, intersection, primitive).

**Rule of thumb:** Dùng `interface` cho object shape (page object, response). Dùng `type` cho union/intersection/utility.

```ts
interface Product { id: string; name: string; price: number; }
type Status = 'active' | 'inactive';
type ProductWithStatus = Product & { status: Status };
```

---

### T3. Web Service / API Test Automation Tools in JS

**Đã có ở section 3:** Q34-56 cover REST principles, status codes, auth (JWT/OAuth), positive/negative, schema vs business validation, retry, rate limit.

#### T3.1 — HTTP libraries trong JS: fetch / axios / Playwright request / supertest — khác nhau?

| Library | Đặc điểm | Khi nào dùng |
|---|---|---|
| **fetch** (native) | Built-in từ Node 18+, chuẩn web | Test gọn, không muốn thêm dep |
| **axios** | Phổ biến nhất, interceptor mạnh, auto-JSON | API test general purpose |
| **Playwright `request`** | Cùng framework với UI test, dùng baseURL/header/cookie chung | E2E project có cả UI+API |
| **supertest** | Test in-process Node app (không cần server chạy) | Unit/integration BE Express/Koa |
| **got / node-fetch** | Server-side fetch alternatives | Scraping, server scripts |

**Trong project Uniqlo:** dùng Playwright `request` để 1 framework lo cả 2.

---

#### T3.2 — Schema validation: Zod / Joi / AJV — chọn cái nào?

| Tool | Đặc điểm |
|---|---|
| **Zod** | TS-first, infer type từ schema → 1 nguồn cho cả runtime + type. Đang hot 2024-2026. |
| **Joi** | Mature, syntax fluent, popular với Node BE (Hapi). Không tự infer TS type. |
| **AJV** | JSON Schema standard compliance, fastest, best cho contract test với OpenAPI. |

**Recommend cho TS automation:** **Zod**.

```ts
import { z } from 'zod';
const ProductSchema = z.object({ id: z.string(), price: z.number() });
ProductSchema.parse(response.body); // throw nếu sai
type Product = z.infer<typeof ProductSchema>; // auto TS type
```

---

#### T3.3 — API mocking trong JS: MSW / nock / json-server / Playwright route — khác nhau?

| Tool | Tầng mock | Use case |
|---|---|---|
| **MSW (Mock Service Worker)** | Service worker (browser) hoặc Node interceptor | Mock chung cho dev + test, gần với production behavior |
| **nock** | Node HTTP module interceptor | Unit test BE/Node script |
| **json-server** | Mini REST server từ JSON file | PoC, demo, FE dev không cần BE |
| **Playwright `page.route`** | Browser network layer | E2E test (như đã làm ở project) |
| **WireMock / MockServer** | Standalone server | Mock cross-language (Java microservices) |

**Quy tắc chọn:** scope nhỏ (test isolation) → nock/page.route. Scope rộng (chia sẻ dev+test) → MSW. Cross-language → WireMock.

---

#### T3.4 — Test GraphQL API ra sao trong JS?

**Trả lời:**
- Endpoint duy nhất `/graphql`, dùng POST với body `{ query, variables }`.
- Library: `graphql-request`, hoặc plain axios/fetch.
- Test query + mutation + subscription (WebSocket).
- Schema introspection để validate response.

**Khác REST:** không có status code chuẩn cho business error (200 + `errors` array trong body) → assert vào `body.data` và `body.errors` thay vì status.

```ts
const res = await fetch('/graphql', {
  method: 'POST',
  body: JSON.stringify({ query: '{ user(id: "1") { name } }' })
});
const { data, errors } = await res.json();
expect(errors).toBeUndefined();
expect(data.user.name).toBe('Hai');
```

---

#### T3.5 — WebSocket testing in JS?

**Trả lời:**
- Playwright có hỗ trợ WebSocket frame inspection qua `page.on('websocket')`.
- Library: `ws`, `socket.io-client` cho test ngoài browser.
- Test: connect, send message, assert received, disconnect, reconnect.

---

#### T3.6 — Pact (contract testing) in JS hoạt động thế nào?

**Summary:** Consumer (FE) định nghĩa contract → Pact tạo mock + file pact. Producer (BE) verify response match pact đó.

**Flow:**
1. Consumer test: viết test gọi mock → sinh `consumer-producer.json` (pact file).
2. Pact Broker lưu pact.
3. Producer CI: download pact → chạy verification → fail nếu BE break contract.

**Pros:** Phát hiện breaking change giữa service mà không cần deploy đầy đủ.

---

#### T3.7 — Newman vs code-based API test trong CI?

| | Newman (Postman) | Code-based (Playwright/axios) |
|---|---|---|
| Author | GUI, dễ cho manual QA | TS/JS code |
| Version control | JSON collection (clunky diff) | Clean Git diff |
| Logic phức tạp | Hạn chế (JS trong test tab) | Đầy đủ TS power |
| Sharing | Postman workspace | Repo + PR review |
| CI | `newman run collection.json` | `npx playwright test` |

**Trend:** code-based win cho automation regression. Postman dùng cho exploratory + manual share.

---

#### T3.8 — Auth flow trong API test: token refresh, OAuth2 — handle sao?

**Trả lời:**
- **API Key:** đơn giản, gắn header trong fixture/config.
- **JWT/Bearer:** login một lần ở `globalSetup`, lưu token, dùng cho mọi test.
- **OAuth2 Authorization Code:** test bằng resource owner password grant (nếu có), hoặc service account token, hoặc mock auth provider.
- **Token refresh:** axios interceptor / Playwright request fixture auto-refresh khi 401.

```ts
// fixture
authedApi: async ({ playwright }, use) => {
  const loginRes = await playwright.request.post('/login', { data: creds });
  const { token } = await loginRes.json();
  const api = await playwright.request.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${token}` }
  });
  await use(api);
}
```

---

#### T3.9 — Test data setup: tạo qua API hay seed DB?

| | API setup | DB seed |
|---|---|---|
| Pros | Realistic (go through validation), không cần DB access | Nhanh, control 100% data |
| Cons | Chậm, phụ thuộc API ổn định | Bypass business logic, risk data invalid |
| Khi dùng | E2E test FE, business flow | Performance test, large dataset |

**Best practice:** prefer API setup, dùng DB seed cho heavy load.

---

### T4. Web UI Test Automation Tools in JS

**Đã có:** Q22-33 (UI testing basics), B1 (framework comparison), B2 (Playwright weaknesses), phần mock browser-level đã thảo luận.

#### T4.1 — Playwright vs Cypress — deep comparison (beyond B1)

| Aspect | Playwright | Cypress |
|---|---|---|
| Architecture | Out-of-process (driver outside browser) | In-browser (test chạy trong cùng browser context) |
| Multi-tab/origin | ✅ Native | ⚠️ Hạn chế (cải thiện v12+ nhưng còn quirk) |
| Browser support | Chromium + Firefox + WebKit | Chromium-based + Firefox (no Safari/WebKit) |
| Auto-wait | ✅ Default | ✅ Default |
| Network mock | `page.route()` flexible | `cy.intercept()` powerful |
| Iframe | ✅ Tốt | ⚠️ Phức tạp |
| Parallel | Built-in free | Cypress Cloud (paid) hoặc tự build |
| Language | TS/JS/Python/Java/.NET | JS/TS only |
| DX runner | UI Mode (mới, ổn) | Test Runner (xuất sắc) |
| Debug | Trace Viewer (post-mortem) | Time-travel trong runner |

**Khi chọn Cypress:** team dev JS-only, ưu tiên DX, không cần Safari, không cần multi-tab.
**Khi chọn Playwright:** đa số case modern, cross-browser, multi-context, mobile emulation.

---

#### T4.2 — Selenium WebDriver JS bindings — hoạt động sao?

**Summary:** Selenium WebDriver = chuẩn W3C giao tiếp với browser qua HTTP. JS bindings (`selenium-webdriver` npm) wrap chuẩn này.

**Flow:**
```
Test code (JS) → WebDriver client → HTTP → ChromeDriver → Chrome
```

**Khác Playwright:** Playwright giao tiếp qua CDP (Chrome DevTools Protocol) — nhanh hơn, nhiều capability hơn (network intercept, geolocation thật...).

**Khi vẫn dùng Selenium-JS:** team đã có infra Grid (BrowserStack/Sauce), cần ngôn ngữ ngoài JS, dự án legacy.

---

#### T4.3 — Auto-wait trong Playwright — cơ chế cụ thể?

**Summary:** Trước mỗi action (click, fill, ...) Playwright tự đợi element thoả mãn các điều kiện:
- Attached to DOM.
- Visible (có size, không `display: none`).
- Stable (không animation).
- Enabled (không disabled).
- Receives events (không bị element khác che).

→ Không cần `sleep` hay `waitFor` explicit cho most cases.

**Khác Selenium:** Selenium chỉ check element tồn tại → action có thể fail nếu chưa visible/clickable → phải tự code `WebDriverWait`.

**Pitfall:** auto-wait không cover được:
- Custom condition (chờ network response, chờ data load) → vẫn cần `waitForResponse`, `waitForFunction`.
- Race condition giữa nhiều element.

---

#### T4.4 — Visual regression in JS: Percy / Applitools / Playwright snapshot — chọn cái nào?

| Tool | Đặc điểm |
|---|---|
| **Playwright `toHaveScreenshot`** | Built-in, pixel diff, free | Smoke visual đơn giản |
| **Percy (BrowserStack)** | Cloud, cross-browser, smart diff | Team có budget, cross-browser visual |
| **Applitools Eyes** | AI-powered diff (ignore minor anti-aliasing), best DOM diff | Enterprise, visual critical |
| **Argos / Lost Pixel** | Open source alternative | Self-host visual regression |

**Pitfall visual test:** pixel-perfect quá strict → flaky vì font render khác OS, animation, dynamic content. Cần mask dynamic region, threshold tolerance.

---

#### T4.5 — BDD với Cucumber.js — pros / cons?

**Summary:** Cucumber.js cho viết test bằng Gherkin (Given/When/Then), tách feature file (business-readable) khỏi step definition (code).

**Pros:**
- Business/PO đọc được test.
- Collaboration tốt với BA.
- Reuse step.

**Cons:**
- Overhead viết step definition.
- Khó debug khi feature file lệch với code.
- Playwright không có integration native → cần `@cucumber/cucumber` + custom world + custom assertion.
- BDD không phải solution mặc định — chỉ giá trị khi business thực sự đọc test.

**Khi nào dùng:** dự án có BA/PO involved vào test design. Không thì viết TS trực tiếp gọn hơn.

---

#### T4.6 — Trace Viewer Playwright — debug sao?

**Summary:** Trace = ZIP file chứa toàn bộ thông tin run (DOM snapshot, screenshot, network, console) tại mọi step.

**Flow:**
1. Enable trace: `trace: 'retain-on-failure'` trong config.
2. Test fail → trace.zip sinh ở `test-results/`.
3. Mở: `npx playwright show-trace trace.zip`.
4. Time-travel qua từng action: DOM trước/sau, log, network request, screenshot.

**Pros:** Debug CI fail mà không reproduce local — vô địch ở mảng này.

---

#### T4.7 — Multi-tab / multi-context testing?

**Trả lời:**
- **Multi-tab cùng context (cùng cookie/storage):** `context.newPage()`.
- **Multi-context (user khác nhau, isolation):** `browser.newContext()` → 2 user đăng nhập song song.

**Use case:** test chat 2 user, test admin + user, OAuth popup flow.

```ts
test('two users chat', async ({ browser }) => {
  const userA = await browser.newContext({ storageState: 'userA.json' });
  const userB = await browser.newContext({ storageState: 'userB.json' });
  const pageA = await userA.newPage();
  const pageB = await userB.newPage();
  // ...
});
```

**Cypress yếu ở chỗ này** — multi-context là điểm Playwright thắng rõ.

---

#### T4.8 — Mobile emulation vs real device?

**Trả lời:**
- **Emulation Playwright:** `devices['iPhone 13']` → viewport + user-agent + touch → đủ cho responsive web test.
- **Real device (BrowserStack, real iOS Safari):** cần khi test feature platform-specific (push notification, biometric, real Safari quirk).

**Pitfall emulation:** không phải Safari thật. Khác về JS engine, storage policy, autoplay.

---

#### T4.9 — Codegen có nên dùng không?

**Summary:** `npx playwright codegen <url>` mở browser, ghi lại action → generate TS code.

**Pros:** Nhanh tạo prototype, khám phá locator.

**Cons:**
- Locator generated đôi khi fragile (CSS nth-child).
- Không follow POM structure.
- Cần refactor mạnh trước khi commit.

**Khi dùng:** prototype, không quen DOM. **Không dùng:** commit thẳng vào codebase.

---

#### T4.10 — Best practices: locator stability

**Đã cover ở Q74**. Tóm lại: `getByRole` > `getByLabel` > `data-testid` > CSS attribute > XPath. Tránh: nth-child, class auto-generated, full XPath.

---

## Bonus: API Object Model & Test Structure

> [!IMPORTANT]
> POM group theo **page**, API group theo **resource**. Cùng triết lý: tách *thứ tương tác* khỏi *cách test đọc*. Đây là pattern industry-standard — tên khác nhau (Service Object / API Object / Repository) nhưng cùng intent.

### API.1 — POM cho UI, API testing organize theo gì?

**Summary:** API group theo **RESOURCE / ENTITY** (noun), không phải theo function/verb. Đây là **Service Object Model / API Object Model**.

**Giải thích:** REST API thiết kế quanh resource (`/products`, `/orders`, `/users`). Test mirror cấu trúc đó → mỗi resource = 1 class. Cùng nguyên tắc với POM (mỗi page = 1 class).

| POM | API Object |
|---|---|
| Group theo page (UI surface) | Group theo resource (server surface) |
| `HomePage`, `CartPage` | `ProductApi`, `CartApi` |
| `BasePage` lo cookie / nav | `BaseApi` lo auth / retry |

---

### API.2 — 4 cách group API classes, chọn cái nào?

**Summary:** Mặc định **Resource-based**. 3 cách còn lại là biến thể cho context riêng.

**1. Theo Resource / Entity (recommended, 80% case):**
```
src/api/
├── product.api.ts    /products/*
├── cart.api.ts       /cart/*
├── order.api.ts      /orders/*
└── auth.api.ts       /auth/*
```

**2. Theo Microservice (nếu BE chia service rõ):**
```
src/api/
├── user-service/
├── order-service/
└── inventory-service/
```

**3. Theo Domain / Business capability:**
```
src/api/
├── checkout/   ← cart + payment + shipping (cross-resource)
└── catalog/    ← product + category + search
```

**4. Workflow / Flow layer (lớp TRÊN resource):**
```
src/api/flows/purchase.flow.ts   ← login → cart → pay (gọi nhiều resource)
```

> [!TIP]
> Mặc định chọn Resource-based. Đổi qua Microservice nếu BE deploy độc lập từng service. Domain-based dùng khi monolith chia team theo business capability.

---

### API.3 — Kiến trúc 3 layer (Base / Resource / Flow)

**Summary:** Test gọi Resource hoặc Flow, không gọi Base trực tiếp.

```
TEST spec
   ↓
Flow layer (optional): compose multi-resource cho business action
   ↓
Resource layer: 1 class / 1 resource, lo CRUD + payload typing
   ↓
Base layer: auth header, baseURL, retry, error handling
```

**Ví dụ ProductApi (resource layer):**

```ts
export class ProductApi extends BaseApi {
  list(query?: { category?: string; limit?: number }) {
    return this.request.get('/products', { params: query });
  }
  getById(id: string) {
    return this.request.get(`/products/${id}`);
  }
  search(q: string) {
    return this.request.post('/products/search', { data: { query: q } });
  }
}
```

**Ví dụ CheckoutFlow (flow layer):**

```ts
export class CheckoutFlow {
  constructor(
    private authApi: AuthApi,
    private cartApi: CartApi,
    private paymentApi: PaymentApi,
  ) {}

  async placeOrder(user: User, items: CartItem[]) {
    await this.authApi.login(user);
    const cart = await this.cartApi.create();
    for (const item of items) await this.cartApi.addItem(cart.id, item);
    return this.paymentApi.checkout(cart.id);
  }
}
```

> [!IMPORTANT]
> Flow chỉ gọi Resource, KHÔNG gọi Flow khác. Flow là wrapper cho test, không phải để compose tiếp. Nếu cần "flow gọi flow", refactor thành nhiều Resource call ở Flow ngoài.

---

### API.4 — Structure folder test (mirror src)

**Summary:** Test mirror src 1-1. `tests/api/<resource>.spec.ts` + `tests/api/flows/` cho E2E API.

```
src/api/                       tests/api/
├── base.api.ts                 ├── product.api.spec.ts     ← test ProductApi
├── product.api.ts        →     ├── cart.api.spec.ts        ← test CartApi
├── cart.api.ts           →     ├── auth.api.spec.ts        ← test AuthApi
├── auth.api.ts           →     │
└── flows/                      ├── flows/                   ← E2E multi-resource
    └── purchase.flow.ts  →     │   └── purchase.flow.spec.ts
                                ├── fixtures/                ← mock payload
                                └── helpers/                 ← mock server, schema validator
```

**Khi nào file vs folder per resource?**

| Resource size | Cấu trúc |
|---|---|
| Nhỏ (5–10 endpoint) | 1 file: `product.api.spec.ts` |
| Vừa (15–30 endpoint) | 1 folder: `product/list.spec.ts`, `product/create.spec.ts` |
| Rất lớn (50+) | Folder + sub-folder theo sub-resource |

> [!NOTE]
> Mock test tách thành file riêng (`*.mock.spec.ts`) vì **setup khác** (mock server local), không phải vì test resource khác. Convention by setup, không phải by resource.

---

### API.5 — Biên giới Resource test ↔ Flow test

**Summary:** Resource test = 1 API class bị assert. Flow test = nhiều API class.

| Trường hợp | Phân loại |
|---|---|
| Test nhiều method của `CartApi` | Resource test (1 class) |
| `productApi.search()` rồi `productApi.getById()` | Resource test (cùng class) |
| `authApi.login()` → `cartApi.add()` → `paymentApi.checkout()` | Flow test (3 class) |
| `authApi.login()` chỉ để setup, rồi test `cartApi.*` | Resource test (login là setup) |

> [!KEY]
> Đếm số API class bị **assert chính**, không phải đếm số call. Test có **business name** (purchase, refund, onboarding) → là Flow. Tên kỹ thuật → là Resource test.

---

### API.6 — Naming convention

| Loại | Pattern | Ví dụ |
|---|---|---|
| Resource spec | `<resource>.api.spec.ts` | `product.api.spec.ts` |
| Mock variant | `<resource>.mock.spec.ts` | `product.mock.spec.ts` |
| Flow spec | `<flow-name>.flow.spec.ts` | `purchase.flow.spec.ts` |
| Contract spec | `<resource>.contract.spec.ts` | `product.contract.spec.ts` |

---

### API.7 — Anti-patterns

> [!GOTCHA]
> **Group theo HTTP verb** (`GetApi`, `PostApi`, `DeleteApi`) — vô nghĩa. Verb là cách bạn tương tác, không phải resource. Scatter logic của 1 resource ra nhiều class.

> [!GOTCHA]
> **Group theo test scenario** (`HappyPathApi`, `NegativeApi`) — nhầm layer. Scenario thuộc spec, không thuộc API layer. API class phải scenario-agnostic.

> [!GOTCHA]
> **Flow gọi Flow** — dependency chain rối rắm. Flow chỉ gọi Resource.

> [!GOTCHA]
> **Trộn resource test với flow trong 1 file** — `product.api.spec.ts` có test "happy path checkout" gọi 5 API là flow trá hình. Tách ra `flows/`.

---

### API.8 — Câu chốt cho interview

> "POM group theo page vì page là UI surface; API group theo **resource** vì resource là server surface — cùng triết lý: tách *thứ tương tác* khỏi *cách test đọc*. Tôi có **base layer** lo auth/retry, **resource layer** mirror REST endpoint (`/products` → `ProductApi`), và **flow layer** (optional) cho composite business action. Tôi không group API theo HTTP verb hay test scenario — đó là anti-pattern vì scatter logic của cùng 1 resource."

Câu này gây impression với senior interviewer vì show **architectural thinking** thay vì chỉ liệt kê endpoint.

---

## Killer Questions

### 126. Bug nghiêm trọng nhất bạn từng gặp?

**Trả lời mẫu (kể câu chuyện cụ thể):** Trong project e-commerce, sau khi refactor module discount, coupon code "TEST10" để dev test không bị disable trên production → user dùng giảm 10% mọi đơn. Phát hiện sau 6 giờ. Lesson:
- Production data hygiene quan trọng.
- Feature flag/data flag để separate test data.
- Monitoring discount usage anomaly nên có alert.

(Lưu ý: kể câu chuyện thật của bạn, nhấn mạnh **impact, root cause, lesson learned**.)

---

### 127. Automation challenge lớn nhất?

**Trả lời mẫu:** Cross-browser test trên Safari trong Docker - Safari không chạy được trong Linux container. Giải pháp: dùng Webkit (Playwright support), kết hợp BrowserStack cho real Safari trên macOS. Trade-off cost vs coverage.

---

### 128. Bạn improve process gì trong team?

**Trả lời mẫu:** Introduce test tagging (smoke, regression, critical) → giảm CI thời gian từ 45p còn 8p cho smoke, đầy đủ regression chạy nightly. Team review PR nhanh hơn, deploy thường xuyên hơn.

---

### 129. Một lần bạn disagree với requirement?

**Trả lời mẫu:** PO muốn skip validation password complexity. Tôi đưa ra security risk + compliance (GDPR/PCI). Setup meeting với security team. Cuối cùng giữ validation với UX tốt hơn (show requirement realtime).

---

### 130. Điều gì làm một automation framework "good"?

**Trả lời:**
- **Reliable:** ít flaky, kết quả tin được.
- **Fast:** feedback nhanh.
- **Maintainable:** dễ update khi UI/API change.
- **Scalable:** dễ add test mới.
- **Readable:** Dev/QA mới onboard nhanh.
- **Debuggable:** fail có đủ info để fix.
- **Integrated:** chạy được trong CI/CD.

---

## Middle-Level Mindset

### 131. Quality là trách nhiệm của ai?

**Trả lời:** Của cả team. Dev viết code đúng, QA verify, PO clarify requirement, DevOps đảm bảo infra. QA là người advocate mạnh nhất nhưng không phải gatekeeper duy nhất.

---

### 132. Bạn prioritize testing thế nào?

**Trả lời:** Risk-based.
- Impact (revenue, user, compliance).
- Probability (area vừa thay đổi, history bug).
- Coverage gap.
- Quick win vs long-term investment.

---

### 133. Làm sao balance speed vs quality?

**Trả lời:**
- Automation cho speed (regression tự động).
- Risk-based để focus.
- Shift-left để bắt bug sớm = nhanh hơn.
- Quality không phải "test thật nhiều" mà "test đúng chỗ".
- Communicate trade-off với stakeholder.

---

### 134. Khi nào nên stop testing?

**Trả lời:** Không có "đủ" hoàn hảo. Stop khi:
- Acceptance criteria pass.
- Risk được đánh giá acceptable.
- Test plan complete.
- Diminishing return (effort lớn, value thấp).
- Deadline đến (với risk được document).

---

### 135. "100% automation coverage" có tốt không?

**Trả lời:** Không hẳn. 
- 100% code coverage không = bug-free.
- Một số test value cao nhưng cost automate quá cao (UX, accessibility subjective).
- Maintenance cost tăng nonlinear với số test.
- Focus vào **meaningful coverage** (critical path, risk area) thay vì số %.

**Mục tiêu:** Confidence to release, không phải con số trên báo cáo.

---

## 10. Kafka & Event-Driven Testing

### General — Concepts

### 136. Kafka là gì? Khác message queue truyền thống (RabbitMQ/ActiveMQ) ở điểm nào?

**Summary:** Kafka là **distributed event streaming platform** — bản chất là **commit log** phân tán, bền vững, replay được. Khác MQ truyền thống: message **không bị xóa sau khi consume** (giữ theo retention, đọc lại được); consumer **pull** thay vì broker push; consumer **tự quản offset**; throughput rất cao (triệu msg/s).

---

### 137. Giải thích topic, partition, offset, consumer group.

**Summary:**
- **Topic**: kênh logic chứa message (vd `scan-result`).
- **Partition**: topic chia nhỏ để song song + là **đơn vị giữ thứ tự**.
- **Offset**: số thứ tự tăng dần của message *trong 1 partition*.
- **Consumer group**: nhóm consumer cùng `group.id` chia nhau partition; mỗi partition chỉ **1 consumer trong group** đọc.

---

### 138. Partition dùng để làm gì? Quan hệ với parallelism và ordering?

**Summary:** Partition cho phép **scale ngang** (nhiều consumer đọc song song) và là **đơn vị ordering** (thứ tự chỉ đảm bảo trong 1 partition). Số consumer hữu ích tối đa trong 1 group = **số partition**; dư consumer sẽ ngồi không.

---

### 139. Producer quyết định message vào partition nào như thế nào?

**Summary:** Do **partitioner trong producer client** (chạy phía app, **không phải broker**). Có key → `hash(key) % số_partition` → cùng key vào cùng partition. Không key → round-robin/sticky. Broker chỉ append vào partition đã được chỉ định sẵn.

---

### 140. Kafka đảm bảo ordering ở phạm vi nào? Làm sao giữ thứ tự cho nhóm message liên quan?

**Summary:** Chỉ trong **1 partition**, KHÔNG toàn topic. Muốn giữ thứ tự cho nhóm message liên quan → set **cùng key** để chúng rơi vào cùng partition. Broker append theo thứ tự nhận và gán offset tăng dần; consumer đọc tuần tự theo offset.

---

### 141. Điều gì có thể làm vỡ ordering dù đã set key đúng?

**Summary:** 3 chỗ:
- **Producer**: `max.in.flight > 1` + retry mà KHÔNG bật `enable.idempotence` → retry ghi sai thứ tự.
- **Reshard**: đổi số partition làm `hash(key)%N` đổi → cùng key sang partition khác.
- **Consumer**: xử lý đa luồng/async → đọc đúng thứ tự nhưng side-effect ra sai thứ tự.

---

### 142. Delivery semantics: at-most-once / at-least-once / exactly-once khác nhau ra sao?

**Summary:**
- **At-most-once** (≤1, có thể **mất**): commit offset *trước* khi xử lý.
- **At-least-once** (≥1, có thể **trùng**): xử lý xong *rồi* mới commit. Phổ biến nhất.
- **Exactly-once** (đúng 1 lần): `enable.idempotence` + transactions + consumer `isolation.level=read_committed`.

---

### 143. Vì sao at-least-once phổ biến? Hệ quả với QA là gì?

**Summary:** Vì dễ cấu hình và không mất message. Hệ quả: **duplicate là chuyện bình thường** → consumer phải **idempotent** (dedup theo event-id). Câu QA cần đặt: *"xử lý cùng message 2 lần có tạo 2 kết quả không?"* — nếu có là bug, và phải có test case cho nó.

---

### 144. Consumer offset là gì? Auto-commit vs manual commit khác nhau thế nào?

**Summary:** Committed offset = "đã xử lý tới đâu", restart đọc tiếp từ đó. **Auto-commit** theo interval → tiện nhưng có thể commit message *chưa xử lý xong* → mất khi crash. **Manual commit** (sau khi xử lý) → kiểm soát chính xác, là nền tảng của at-least-once đúng nghĩa.

---

### 145. auto.offset.reset (earliest vs latest) ảnh hưởng test ra sao?

**Summary:** Khi group chưa có offset: `earliest` đọc từ đầu, `latest` chỉ message mới. Sai cái này → test "không thấy message nào" (vd produce trước khi consumer kịp join + `latest`). Đây là nguồn **flaky kinh điển** khi viết test consumer.

---

### 146. Consumer group rebalance là gì? Khi nào xảy ra, ảnh hưởng gì?

**Summary:** Khi consumer join/leave hoặc đổi số partition, partition được chia lại trong group. Lúc rebalance consume **tạm dừng** → tăng độ trễ, có thể gây duplicate. **Rebalance storm** (do `session.timeout`/`max.poll.interval` sai) làm lag tăng vọt — bug production phổ biến.

---

### 147. Consumer lag là gì? Vì sao quan trọng? Đo bằng công cụ nào?

**Summary:** Lag = **log-end-offset − committed-offset** = số message chưa consume. Là **metric vàng** để biết consumer có theo kịp không (lag tăng đều → consumer chậm/chết/rebalance). Đo bằng `kafka-consumer-groups --describe`, Burrow, Kafka Lag Exporter + Prometheus.

---

### 148. Retention vs log compaction khác nhau thế nào?

**Summary:** **Retention** xóa message theo *thời gian/size* (hết hạn là mất). **Log compaction** giữ **message mới nhất cho mỗi key** (snapshot trạng thái); tombstone (value = null) = xóa key. QA lưu ý: retention ngắn có thể dọn message test trước khi assert.

---

### 149. acks, ISR, min.insync.replicas liên quan tới durability ra sao?

**Summary:** `acks=0` (không chờ, có thể mất), `1` (leader xác nhận), `all` (toàn ISR — bền nhất). **ISR** = replica bắt kịp leader. **min.insync.replicas** = số replica tối thiểu để `acks=all` được ghi; không đủ → producer **báo lỗi thay vì âm thầm mất**. RF quyết định chịu mất mấy broker.

---

### 150. Schema Registry và schema evolution là gì? Vì sao là nguồn bug tích hợp?

**Summary:** Schema Registry quản lý schema (Avro/Protobuf/JSON) + **compatibility** (BACKWARD/FORWARD/FULL). **Schema evolution** = producer đổi schema; nếu không tương thích → consumer cũ vỡ → **nguồn bug tích hợp số 1**. QA nên đưa compatibility check + contract test vào CI thay vì phát hiện ở production.

---

### 151. Điểm mạnh / điểm yếu của Kafka? Khi nào KHÔNG nên dùng?

**Summary:**
- **Mạnh**: throughput cao, durable + replay, decoupling producer/consumer, scale ngang.
- **Yếu**: vận hành phức tạp; không có per-message ack/priority/TTL như MQ (phải tự build DLQ/retry); không ordering toàn cục; eventually consistent (khó test); không query như DB.
- **KHÔNG nên dùng** khi: cần request-response đồng bộ, volume thấp, hoặc cần hàng đợi tác vụ có priority/TTL.

---

### General — Testing

### 152. Test hệ thống dùng Kafka khác test REST API ở điểm nào?

**Summary:** Action và effect **tách rời theo thời gian** (async). Không "gọi → assert response" ngay được; phải verify **side-effect** (message lên topic, DB/datalog) theo kiểu **eventually-consistent**: **poll-until-condition + timeout**, KHÔNG `sleep` cứng (anti-pattern: flaky + chậm).

---

### 153. Có những tầng/loại test nào cho hệ Kafka? Dùng tool gì?

**Summary:**
- **Component** (1 service): embedded/Testcontainers Kafka.
- **Contract**: schema compatibility / Pact (async).
- **Integration/E2E**: produce đầu → assert side-effect cuối.
- **Non-functional**: throughput, lag dưới tải, resilience.

**Tool:** Testcontainers `KafkaContainer`, `@EmbeddedKafka` (JVM), `TopologyTestDriver` (Streams), `kcat` + `kafka-consumer-groups` (CLI), UI (AKHQ / Kafka UI / Conduktor).

---

### 154. Nguyên nhân gây flaky test khi test Kafka và cách phòng tránh?

**Summary:** Nguyên nhân: (1) assert quá sớm; (2) `auto.offset.reset` sai; (3) dùng lại `group.id` → đọc nhầm offset; (4) topic/datalog không cô lập giữa test; (5) late event. **Phòng:** poll-until thay sleep, `group.id`/topic độc lập mỗi run, dọn dữ liệu, cửa sổ chờ late arrival.

---

### 155. Làm sao test ordering, duplicate, poison-pill (DLQ)?

**Summary:**
- **Ordering**: gửi N message cùng key, payload đánh số `1..N` → assert nhận đúng thứ tự.
- **Duplicate**: gửi/replay cùng message → verify hệ **idempotent** (không nhân đôi kết quả).
- **Poison-pill**: gửi message lỗi schema → verify vào **DLQ**, partition không bị kẹt, alert bắn.

---

### MDaaS Scenario

### 156. Mô tả cách test hệ scan file event-driven của bạn (end-to-end).

**Summary:** Test produce một scan request kèm `request_id` (làm **partition key**) vào topic `scan`. Engine xử lý, phát result lên topic `scan-result-*`. Một consumer riêng gom result theo `request_id` vào datalog; test **poll datalog** tới khi gặp terminal event `progress_percentage == 100` + đối chiếu đủ child/sanitized file, rồi **verify payload bản ghi cuối** như verify response body API.

---

### 157. Bạn xác định "một request đã xử lý xong" như thế nào?

**Summary:** Terminal event = main file `progress_percentage == 100`, **CỘNG** đối chiếu đủ child file (`files_in_archive`) và sanitized file (theo `original_id`), **CỘNG** cửa sổ chờ ~10s cho late arrival. Đủ điều kiện mới coi là complete rồi mới assert payload.

---

### 158. Vì sao consumer dùng group.id random mỗi lần chạy?

**Summary:** Tạo `group.id` random (`file-scan-result-msg-auto-kafka-...`) để **tránh dùng lại offset cũ** của lần chạy trước → mỗi lần test bắt đầu sạch, không bị "đã commit nên không đọc lại". Đây là **test isolation** ở tầng consumer group.

---

### 159. Bạn đảm bảo và verify ordering trong dự án ra sao?

**Summary:** Producer set **key = `request_id`** → mọi message cùng request vào **cùng partition** → Kafka giữ thứ tự theo offset; consumer đọc tuần tự. Assert ở **mức nghiệp vụ**: chuỗi `progress_percentage` của 1 request phải **monotonic non-decreasing** (`verifyItemOfArray_IsSorted`).

---

### 160. Consumer merge nhiều partition/topic vào một datalog — thứ tự trong file có đáng tin không?

**Summary:** Thứ tự **toàn cục** trong file KHÔNG đáng tin (merge nhiều partition). Nhưng tôi chỉ assert ordering **trong phạm vi 1 `request_id`** — các message đó cùng 1 partition nên thứ tự được giữ. Không bao giờ dựa vào thứ tự giữa các request khác nhau.

---

### 161. Vì sao cần cửa sổ chờ sau khi thấy progress_percentage == 100?

**Summary:** Message phụ (sanitized/child) có thể **đến SAU** terminal event của main file. Assert ngay lúc thấy 100% sẽ **thiếu dữ liệu** → false negative. Cửa sổ chờ xử lý **out-of-order / late event** ở mức ứng dụng.

---

### 162. Vì sao tách consumer ra process riêng ghi datalog rồi test mới poll, thay vì consume trực tiếp trong test?

**Summary:** **Decoupling**: consumer chạy dài gom liên tục, test chỉ là bên đọc → đơn giản, ổn định hơn. Đổi lại có **race condition file I/O** → giảm bằng **batch-write theo interval**. Trade-off: thêm độ trễ + một điểm phức tạp; nếu làm lại sẽ cân nhắc consume in-test bằng Testcontainers cho cô lập.

---

### 163. Hệ test của bạn CHƯA cover gì? Bạn sẽ bổ sung gì?

**Summary:** Trung thực liệt kê khoảng trống:
- **Duplicate / idempotency** — replay message, verify không nhân đôi kết quả.
- **Consumer lag dưới tải** — bơm N request/s, đo lag không tăng vô hạn.
- **Resilience** — kill broker (RF≥2), rebalance khi scale consumer.
- **DLQ / poison-pill** — message lỗi schema có vào DLQ, partition không kẹt.
- **Schema evolution / contract test** trong CI.

**Tín hiệu senior:** việc thật → ánh xạ khái niệm Kafka → chủ động nêu giới hạn + cái sẽ thêm.

---

### 164. Bạn nói có test ordering — vậy có test idempotent producer / reorder-on-retry không?

**Summary:** **Không** — tôi là **consumer-only**, không điều khiển producer config. Tôi assert ordering **mức nghiệp vụ** (progress monotonic), dựa trên đảm bảo Kafka rằng cùng key → cùng partition → giữ thứ tự. Việc verify `enable.idempotence` / hành vi reorder-on-retry phía producer nằm **ngoài phạm vi** hiện tại.

> [!IMPORTANT]
> Đừng overclaim. Nói đúng "ordering mức nghiệp vụ" thay vì "test ordering guarantee của Kafka" là khác biệt giữa ứng viên trung thực-có-chiều-sâu và ứng viên bị bắt bài.

---

## 11. Round 2 — Manager Interview (Behavioral & Process)

> Round 2 với manager ít hỏi định nghĩa sách vở, họ nghe **cách bạn tư duy, ra quyết định và làm việc với người khác**.
> Công thức trả lời: **khái niệm ngắn → cách mình áp dụng thực tế → 1 ví dụ cụ thể**. Behavioral thì dùng **STAR** (Situation → Task → Action → Result).

### Agile, Meeting & Documentation

### 175. Vai trò của QA trong Scrum team và trong từng ceremony?

**Summary:** QA không phải "khâu cuối gác cổng" mà tham gia xuyên suốt sprint, đảm bảo chất lượng là trách nhiệm chung của cả team.

**Giải thích — vai trò QA theo từng ceremony:**

| Ceremony | Đóng góp của QA |
|---|---|
| **Sprint Planning** | Estimate effort test, chỉ ra story rủi ro/khó test, đề xuất tách task |
| **Daily Standup** | Báo tiến độ test, blocker (chờ env, chờ build), bug đang chặn |
| **Backlog Refinement** | Làm rõ Acceptance Criteria, đặt câu hỏi edge case, đảm bảo story "testable" |
| **Sprint Review / Demo** | Xác nhận feature đạt AC, demo kết quả test |
| **Retrospective** | Đề xuất cải tiến quy trình QA (ví dụ bug escape nhiều → thêm regression) |

**Ví dụ:** Trong refinement, tôi hỏi "nếu user search từ khoá không có kết quả thì UI hiển thị gì?" → lộ ra một case chưa ai định nghĩa → được clarify trước khi Dev code, tránh rework.

> [!TIP]
> Câu chốt ăn điểm: *"Quality là trách nhiệm của cả team, QA là người advocate mạnh nhất cho chất lượng và trải nghiệm người dùng."*

### 176. QA nên bắt đầu tham gia từ giai đoạn nào trong một sprint?

**Summary:** Càng sớm càng tốt — **shift-left**. Không chờ Dev code xong mới test.

**Giải thích:** QA tham gia ngay từ requirement/refinement: review AC, đặt câu hỏi edge case, chuẩn bị test case và test data song song khi Dev đang code, review API contract sớm. Bug phát hiện sớm rẻ hơn nhiều lần bug ở production.

**Ví dụ:** Trong khi Dev code feature filter sản phẩm, tôi đã viết xong test case + chuẩn bị data → Dev merge xong là test được ngay trong ngày, không dồn vào cuối sprint.

### 177. Scrum khác Kanban thế nào? Bạn phù hợp mô hình nào?

**Summary:** **Scrum** = sprint cố định + role rõ ràng + commit theo iteration. **Kanban** = dòng chảy liên tục, giới hạn WIP, ưu tiên linh hoạt.

**Giải thích:**
- Scrum hợp với sản phẩm phát triển theo feature, cần nhịp và cam kết theo sprint.
- Kanban hợp với maintenance/support, bug fix, công việc đến liên tục không đoán trước.

**Ví dụ / hướng cá nhân hoá:** *"Team tôi chủ yếu chạy Scrum 2 tuần; giai đoạn hotfix/support production thì chuyển sang tư duy Kanban để xử lý theo mức ưu tiên."* → nêu bạn thực sự đã làm cái nào.

### 178. Definition of Done và Acceptance Criteria khác nhau thế nào?

**Summary:** **Acceptance Criteria (AC)** = điều kiện để một *story cụ thể* được coi là đúng yêu cầu nghiệp vụ. **Definition of Done (DoD)** = tiêu chuẩn chung áp cho *mọi story* để coi là hoàn thành.

**Giải thích:**
- AC riêng cho từng story → QA dựa vào để viết test case và xác định pass/fail.
- DoD chung cho cả team → ví dụ: code reviewed, unit test pass, test case executed, no open S1/S2 bug, merged & deployed to staging.

**Ví dụ:** Story "áp mã giảm giá" có AC "giảm đúng %, không áp cho sản phẩm sale". DoD của team yêu cầu thêm: đã có automation regression + không còn bug major → mới được đóng.

> [!NOTE]
> AC trả lời "story này đúng chưa?"; DoD trả lời "story này đã đủ chất lượng để ship chưa?".

### 179. Bạn tạo và duy trì những tài liệu QA nào?

**Summary:** Test plan/strategy, test case, bug report, test summary report, và tài liệu framework automation.

**Giải thích — theo mức độ dùng:**
- **Test plan / strategy** (câu 170) — cho feature/release lớn: scope, approach, risk, env.
- **Test case** — bám AC, có step + expected result, trace về requirement.
- **Bug report** (câu 88) — title rõ, steps to reproduce, expected vs actual, severity/priority, evidence.
- **Test summary report** (câu 171) — kết quả để stakeholder quyết định release.
- **Tài liệu framework automation** — README, convention (đặt tên locator, cấu trúc Page Object) để người sau maintain được.

**Ví dụ:** Trong repo Playwright, tôi document convention Page Object + fixtures + locale utils để team scale test mà không dẫm chân nhau.

> [!TIP]
> Với Agile, ưu tiên tài liệu *gọn, sống* (test charter, checklist) hơn tài liệu dày cộp ít ai đọc. Phần giá trị nhất luôn là **scope, entry/exit criteria, risk**.

### 180. Meeting nào bạn thấy giá trị nhất với QA?

**Summary:** Với tôi, **Backlog Refinement** giá trị nhất — vì đây là lúc rẻ nhất để phát hiện vấn đề (khi còn là requirement).

**Giải thích:** Ở refinement, một câu hỏi đúng về edge case/AC mơ hồ có thể tiết kiệm cả ngày rework sau này. Retro cũng rất giá trị vì là nơi cải tiến process QA dựa trên data thật.

**Ví dụ:** Hướng cá nhân hoá — chọn 1 meeting bạn thực sự tạo được impact và kể lại impact đó bằng con số/hệ quả cụ thể.

---

### Conflict & Stakeholder Management

### 181. Stakeholder của QA gồm những ai? Bạn giao tiếp với mỗi bên ra sao?

**Summary:** Dev, BA/PO, PM, DevOps, đôi khi cả end user. QA là điểm giao — dịch "yêu cầu nghiệp vụ" thành "chất lượng đo được".

**Giải thích — điều chỉnh ngôn ngữ theo từng bên:**
- **Với Dev:** nói bằng log, request/response, steps to reproduce (technical).
- **Với PO/PM:** nói bằng business impact & risk (user nào bị ảnh hưởng, tần suất, ảnh hưởng doanh thu).
- **Với DevOps:** nói về môi trường, pipeline, data.

**Ví dụ:** Cùng một bug, tôi báo Dev bằng trace + network log, nhưng báo PO bằng "bug này khiến ~5% user không checkout được trên Safari" để họ quyết priority.

### 182. Khi Dev khẳng định "không phải bug / máy tôi chạy ngon" thì bạn xử lý thế nào?

**Summary:** Không cãi cảm tính — đưa **bằng chứng**, quy chiếu về **spec/AC**, và giữ tinh thần "cùng phe".

**Trả lời — các bước:**
1. Cung cấp evidence rõ: steps, môi trường, version, data, log, video/trace.
2. Đối chiếu lại AC/requirement — bug hay không dựa trên spec, không dựa trên ý kiến cá nhân.
3. Nếu spec mơ hồ → kéo BA/PO vào quyết định, không để QA vs Dev tay đôi.
4. Reproduce cùng Dev qua call nếu cần.

**Ví dụ:** Bug chỉ xảy ra trên mobile viewport ở một locale nhất định → tôi quay video trên đúng device + locale để chứng minh reproducible, Dev nhận ra do CSS breakpoint.

> [!GOTCHA]
> Mục tiêu là sản phẩm tốt, không phải "thắng" Dev. Thái độ hợp tác quan trọng ngang bằng chứng cứ.

### 183. Deadline gấp, không đủ thời gian test hết — bạn xử lý thế nào?

**Summary:** **Risk-based prioritization** + minh bạch với stakeholder, đẩy quyết định đánh đổi về đúng người có thẩm quyền.

**Trả lời — các bước:**
1. Ưu tiên **critical path** (login, checkout, payment) và **area vừa thay đổi**.
2. Để automation lo **regression** trên critical path, tập trung tay vào feature mới.
3. Chạy **smoke** đa browser/device thay vì regression full.
4. Communicate rõ: *"Với thời gian này tôi cover được A, B; C, D là rủi ro còn lại — anh/chị quyết định đánh đổi."*

**Ví dụ:** Release gấp một hotfix payment → tôi test full payment flow + smoke các flow chính, skip phần admin ít dùng, và note rõ risk cho PM. (Xem thêm câu 11, 166.)

> [!TIP]
> QA cung cấp thông tin để stakeholder quyết định release — QA không phải gatekeeper duy nhất im lặng chịu trách nhiệm cắt scope.

### 184. Kể một lần bạn có xung đột và cách bạn giải quyết (STAR)

**Cách trả lời:** dùng cấu trúc **STAR**, chọn câu chuyện bạn giải quyết bằng **dữ liệu + giao tiếp**, không phải cãi nhau. Kết thúc bằng kết quả tích cực + bài học.

**Khung mẫu để bạn điền kinh nghiệm thật:**
- **Situation:** bối cảnh (ví dụ bất đồng severity một bug gần release).
- **Task:** vai trò của bạn (cần thuyết phục/đi đến thống nhất).
- **Action:** bạn đã làm gì — thu thập data, quy chiếu impact, kéo đúng người vào.
- **Result:** kết quả + điều học được.

**Hướng ví dụ:**
- Bất đồng severity: bạn thấy High, Dev thấy Low → bạn quy chiếu tần suất user gặp + ảnh hưởng doanh thu → cùng PO phân loại lại.
- Automation báo fail, Dev nghĩ do flaky → bạn điều tra, chứng minh là bug thật (hoặc thừa nhận test flaky và fix) — cho thấy bạn khách quan.

> [!IMPORTANT]
> Chuẩn bị sẵn 3–4 câu chuyện STAR tái sử dụng được: 1 về conflict, 1 về deadline, 1 về bug quan trọng bạn bắt được, 1 về cải tiến process.

### 185. Bất đồng về severity/priority của bug — bạn thuyết phục thế nào?

**Summary:** Dùng **rubric khách quan** thay vì cảm tính: Severity dựa impact kỹ thuật, Priority dựa business.

**Trả lời:** Tôi trình bày theo tiêu chí đã thống nhất (xem câu 165): mức tác động, reproducibility, scope user bị ảnh hưởng, có workaround không, ảnh hưởng revenue/brand/compliance. Đưa data thay vì "tôi nghĩ nó nghiêm trọng". Nếu vẫn khác quan điểm → để PO/PM ra quyết định cuối vì Priority là business decision.

**Ví dụ:** Typo ở homepage — severity thấp nhưng tôi argue priority cao vì ảnh hưởng brand và fix nhanh → được đồng ý fix trong sprint.

### 186. Làm sao để Dev và team tin tưởng automation của bạn?

**Summary:** Test phải **ổn định (ít flaky)** — fail là fail thật; report rõ ràng; tích hợp CI để feedback nhanh.

**Trả lời:**
- Giữ **flaky rate thấp** — Dev mất niềm tin ngay khi test "báo động giả".
- Report có trace/video/log → Dev tái hiện được trong 1 phút.
- Chạy trong CI/CD, hiện kết quả ngay khi push.
- Review test code như production code (không để test rác).

**Ví dụ:** Sau khi tôi bỏ hard wait + isolate test data, flaky rate của bộ E2E giảm rõ → Dev bắt đầu tin và chủ động xem kết quả pipeline trước khi merge.

---

### Test Case Types trong SDLC, Automation & API

### 187. Phân biệt test levels và test types

**Summary:** **Levels** = phân theo phạm vi/độ sâu (unit → integration → system → acceptance). **Types** = phân theo mục đích (smoke, sanity, regression…).

**Giải thích:**

*Test levels:*
- **Unit** — Dev viết, test 1 hàm/component, nhanh nhất, nhiều nhất.
- **Integration** — test tương tác giữa module/service/API.
- **System / E2E** — test toàn luồng như user thật (vùng Playwright của tôi).
- **Acceptance (UAT)** — xác nhận đạt yêu cầu nghiệp vụ, thường có PO/khách hàng.

*Test types (mục đích):*
- **Smoke** — rộng & nông, "build có sống không" → chạy đầu tiên.
- **Sanity** — hẹp & sâu, "cái vừa fix có đúng không".
- **Regression** — đảm bảo thay đổi mới không phá cái cũ → ứng viên số 1 để automate.

**Ví dụ:** Feature checkout: 50 unit test (tính giá) + 15 API test (cart/payment/order) + 3 E2E smoke (happy path). (Xem câu 2, 9.)

### 188. Functional vs Non-functional testing?

**Summary:** **Functional** = hệ thống làm *đúng* việc gì (logic, đúng spec). **Non-functional** = hệ thống làm việc đó *tốt tới đâu* (performance, security, usability, reliability, compatibility).

**Ví dụ:**
- Functional: áp mã giảm giá thì tổng tiền giảm đúng.
- Non-functional: trang kết quả search load < 2s dưới 1000 concurrent user; hoạt động đúng trên Chrome/Safari/mobile.

### 189. Bạn dùng những test case design technique nào?

**Summary:** Equivalence Partitioning, Boundary Value Analysis, Decision Table, State Transition — để **cover nhiều với ít case**.

**Giải thích + ví dụ:**
- **Equivalence Partitioning** — chia input thành nhóm tương đương. Ví dụ số lượng mua: `<1` (invalid), hợp lệ, `> tồn kho` (invalid).
- **Boundary Value Analysis** — test biên. Giỏ tối đa 99 sản phẩm → test 98, 99, 100.
- **Decision Table** — tổ hợp điều kiện. Ví dụ: `có coupon × loại thành viên → giá cuối`.
- **State Transition** — luồng có trạng thái. Giỏ hàng → thanh toán → đã đặt → huỷ.

> [!TIP]
> Nhấn mạnh: bạn không viết test ngẫu nhiên mà có phương pháp — đây là điểm phân biệt QA có nghề. (Xem thêm câu 4 Pairwise.)

### 190. Cùng một chức năng, khi nào test qua API, khi nào qua UI?

**Summary:** Logic nghiệp vụ, validation, data → test qua **API** (nhanh, ổn định). Chỉ dùng **UI/E2E** cho luồng người dùng quan trọng và thứ API không phủ được (hiển thị, tương tác).

**Trả lời:** Tôi ưu tiên đẩy coverage xuống tầng API vì rẻ và ổn định; chỉ giữ một số E2E UI mỏng cho critical happy path và các vấn đề thuần render/UX. Đây là tư duy tối ưu chi phí kiểm thử.

**Ví dụ:** Chức năng "áp coupon": test toàn bộ tổ hợp coupon × sản phẩm ở tầng **API**; ở **UI** chỉ verify 1 case rằng giá hiển thị đúng và nút áp mã hoạt động. (Xem câu 80, 82.)

### 191. API testing kiểm tra những gì? Vì sao quan trọng trong SDLC?

**Summary:** API test nhanh & ổn định hơn UI, phát hiện lỗi ở tầng sâu hơn, chạy được ngay cả khi UI chưa xong (shift-left) → ROI cao, nằm ở giữa test pyramid.

**Kiểm tra gì (có hệ thống):**
- **Status code** đúng (200/201/400/401/403/404/500).
- **Response schema** — đúng cấu trúc & kiểu dữ liệu.
- **Business validation** — giá trị đúng logic (không chỉ 200 là pass).
- **Negative testing** — input sai/thiếu field → báo lỗi đúng cách.
- **Auth & phân quyền** — token hợp lệ/hết hạn, role-based (repo tôi có `tests/auth/`, `tests/e2e/auth-roles/`).
- **Boundary & data validation**, **response time**, **side effect** (DB, queue).

**Ví dụ:** Endpoint search sản phẩm Uniqlo — verify status, schema sản phẩm trả về, và case search rỗng trả mảng rỗng chứ không 500. (Xem câu 43–45, 54.)

### 192. Test Pyramid là gì và định hình chiến lược test của bạn ra sao?

**Summary:** Nhiều unit (đáy), vừa integration/API (giữa), ít E2E UI (đỉnh) — vì càng lên cao càng chậm, đắt và flaky.

**Trả lời:** Chiến lược của tôi bám pyramid: đẩy tối đa coverage xuống API/integration, giữ E2E UI mỏng cho critical path. Điều này giữ pipeline nhanh, ổn định và duy trì niềm tin vào automation. Anti-pattern là "ice-cream cone" (nhiều UI, ít unit) → pipeline chậm và flaky. (Xem câu 2.)

**Ví dụ tỷ lệ lý tưởng tôi hướng tới:** ~70% API/integration, ~20% integration UI/component, ~10% E2E UI.

---

### Motivation & Career Path

### 193. Điều gì tạo động lực cho bạn với nghề QA/Automation?

**Summary:** Kết hợp tư duy "phá vỡ để bảo vệ" + coding; cảm giác giá trị khi bắt được bug trước khi tới tay user.

**Trả lời (chân thật, tránh sáo rỗng):** Tôi thích tìm ra chỗ hệ thống có thể sai và biến việc kiểm chứng đó thành code chạy tự động, lặp lại được. Automation cho tôi vừa được code vừa được đảm bảo chất lượng. Tránh nói "vì QA dễ hơn Dev".

**Hướng ví dụ:** kể một khoảnh khắc automation của bạn chặn được một regression trước release — cảm giác "vừa cứu một bàn thua".

### 194. Career path của bạn trong 2–3 năm tới?

**Summary:** Hướng **SDET / Automation Lead** — sâu về framework, CI/CD, mở rộng sang API/performance/security testing và dẫn dắt test strategy.

**Trả lời:** Ngắn hạn: master automation + CI/CD, làm chủ framework của team. Trung hạn: mở rộng phạm vi (API, performance, contract testing), mentor thành viên mới, đóng góp vào chiến lược chất lượng của team. Gắn mục tiêu cá nhân với giá trị cho công ty.

### 195. Vì sao bạn sẵn sàng học Java? Học để làm gì?

**Summary:** Java mở rộng khả năng làm việc với hệ sinh thái test phổ biến và giúp tôi **đọc/hiểu code của Dev** để test sâu hơn.

**Trả lời:**
- Hiện tôi mạnh **TypeScript/Playwright**; học Java để dùng được stack phổ biến (Selenium/RestAssured/JUnit) nếu team cần.
- Quan trọng hơn: đọc được codebase Dev → hiểu logic, viết test đúng trọng tâm, hỗ trợ Dev tốt hơn.
- Có nền lập trình rồi nên học ngôn ngữ mới nhanh — ngôn ngữ chỉ là công cụ, tư duy test mới là cốt lõi.

**Ví dụ / hướng cá nhân hoá:** nếu bạn đã tự học/động tay vào Java (dù nhỏ), kể lại để chứng minh "willing" là thật chứ không chỉ nói.

### 196. "Support dev team" nghĩa là gì với bạn?

**Summary:** Không chỉ tìm bug rồi ném lại — mà giúp Dev **giảm rework**.

**Trả lời:**
- Viết bug report Dev dựng lại được ngay (evidence, môi trường, steps).
- Đề xuất unit test còn thiếu, review PR ở góc độ testability.
- Làm rõ requirement sớm, cung cấp test data/môi trường.
- Debug tới tận log/API để chỉ đúng nguyên nhân thay vì chỉ báo "nó lỗi".

**Ví dụ:** Thay vì report "trang lỗi", tôi trace ra API trả 500 do payload thiếu field và gắn log vào ticket → Dev fix trong vài phút.

### 197. Bạn đang và sẽ ứng dụng AI vào testing như thế nào?

**Summary:** AI là **trợ lý tăng tốc**, QA vẫn review và chịu trách nhiệm cuối — không tin mù quáng output.

**Trả lời (cụ thể):**
- **Sinh test case / test data** từ requirement để tăng coverage & tốc độ.
- **Hỗ trợ viết & maintain automation** (gen Page Object, assertion, giải thích code).
- **Phân tích log/failure** để phân loại bug thật vs flaky.
- **Gợi ý edge case** con người dễ bỏ sót.

**Ví dụ:** Repo của tôi có `ai-orchestrator/` và `tests/e2e/ai-generated/` — tôi đã thử dùng AI generate test scaffold rồi tự tinh chỉnh, rút ngắn thời gian dựng test mới. Nhưng locator và assertion do AI sinh luôn được tôi verify lại. (Xem câu 117–125.)

> [!GOTCHA]
> Điểm ăn tiền: nói rõ *risk* của AI-generated test (locator sai, miss edge case, false confidence) → cho thấy bạn dùng AI có phán đoán, không phụ thuộc.

### 198. Vì sao bạn muốn gia nhập team/công ty này? Bạn có câu hỏi gì cho manager?

**Summary:** Map định hướng cá nhân (automation sâu, học Java, apply AI) với những gì team đang làm; thể hiện đã tìm hiểu; và hỏi ngược lại để cho thấy sự nghiêm túc.

**Trả lời:** Nêu 2–3 điểm cụ thể về sản phẩm/team khiến bạn hứng thú và khớp với thế mạnh của bạn. Tránh câu chung chung "công ty lớn, môi trường tốt".

**Câu hỏi ngược nên chuẩn bị (chọn 2–3):**
- Test strategy hiện tại của team thế nào, mức độ tự động hoá tới đâu?
- Thách thức lớn nhất về chất lượng team đang gặp là gì?
- QA phối hợp với Dev/PO trong quy trình ra sao?
- Cơ hội phát triển lên SDET/Lead trong team như thế nào?

> [!IMPORTANT]
> Luôn chuẩn bị câu hỏi ngược — manager đánh giá cao ứng viên chủ động, và đây là lúc bạn thẩm định xem team có hợp với mình không.

---

## Closing Note

> "A great QA isn't the one who finds the most bugs - it's the one who helps the team ship confidently."

Tips trong interview:
- Trả lời ngắn gọn, có structure (summary → detail → example).
- Đưa ví dụ từ project thật của bạn (có số liệu càng tốt).
- Thẳng thắn về điều chưa biết, đề xuất cách tìm hiểu.
- Show passion về quality và collaboration.
- Đặt câu hỏi ngược lại interviewer (team structure, automation maturity, biggest challenge).

Good luck!
