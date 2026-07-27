
# QA Automation Interview Preparation Questions

## 1. Quality Engineering Mindset

1. Shift-left testing là gì? Lợi ích?
2. Testing Pyramid là gì? Vì sao UI test nên ít hơn API test?
3. Khi nào nên dùng risk-based testing?
4. Pairwise testing là gì? Khi nào phù hợp?
5. Bug Life Cycle gồm các trạng thái nào?
6. Severity và Priority khác nhau thế nào?
7. Verification vs Validation?
8. Retest vs Regression test?
9. Smoke vs Sanity testing?
10. Vì sao QA nên ownership product quality?

### Scenario Questions

11. Nếu release gấp và không đủ thời gian regression toàn bộ, bạn ưu tiên test gì?
12. Một feature ít dùng nhưng liên quan payment, bạn test ra sao?
13. Nếu production có escaped bug, bạn xử lý thế nào?
14. Team có flaky test rate cao, bạn cải thiện ra sao?
15. Nếu PM muốn release dù còn bug medium severity, bạn phản hồi thế nào?

### Product Quality Metrics

16. Defect Density là gì?
17. Bug Escape Rate phản ánh điều gì?
18. MTTD và MTTR khác nhau thế nào?
19. Coverage cao có đồng nghĩa quality cao không?
20. Rollback frequency cao cho thấy điều gì?
21. Metric nào bạn thấy quan trọng nhất trong QA Automation?

### Bổ sung — Severity, Priority & Prioritization

165. Bạn xác định Severity và Priority như thế nào (quy trình cụ thể)?
166. Bạn prioritize các critical test scenario như thế nào?

---

## 2. Web UI Testing

22. Vì sao vẫn cần cross-browser testing dù đã có API test?
23. Khác biệt giữa Chrome, Firefox và Safari testing?
24. Responsive testing là gì?
25. Các issue UI phổ biến bạn từng gặp?
26. Khi nào nên test trên real device thay vì emulator?
27. Bạn dùng DevTools để debug những gì?
28. Làm sao check API request trong browser?
29. Cách identify failed network request?
30. Nếu UI bị broken layout, bạn inspect gì đầu tiên?

### Scenario

31. Feature chỉ fail trên Safari, bạn investigate thế nào?
32. Nếu button click không được nhưng locator đúng?
33. Làm sao debug intermittent UI issue?

---

## 3. API Testing

34. GET vs POST vs PUT vs PATCH vs DELETE?
35. Idempotency là gì?
36. Ý nghĩa status code 200, 201, 400, 401, 403, 404, 500, 502?
37. Khi nào dùng PUT thay vì PATCH?
38. Positive vs Negative test case?
39. Boundary test cho API là gì?
40. Edge case examples?
41. Request chaining là gì?
42. Multi-step workflow testing là gì?
43. Bạn validate API response như thế nào?
44. Schema validation là gì?
45. Business validation khác schema validation thế nào?
46. API Key là gì?
47. JWT hoạt động thế nào?
48. OAuth2 là gì?
49. 401 vs 403 khác nhau thế nào?
50. Bạn test timeout thế nào?
51. Rate limit testing?
52. Retry mechanism test ra sao?
53. Nếu API intermittent fail thì debug gì?

### Scenario

54. API trả 200 nhưng business logic sai, bạn xử lý sao?
55. Làm sao verify data consistency giữa APIs?
56. Nếu login API pass nhưng UI login fail?

---

## 4. Microservices Testing

57. Khó khăn khi test microservices?
58. Service dependency là gì?
59. Mocking dùng khi nào?
60. Contract testing là gì?
61. Consumer-driven contract là gì?
62. Nếu downstream service down thì test gì?
63. Response time validation là gì?
64. Performance awareness trong QA là gì?

### Scenario

65. Một service unstable làm automation fail liên tục, bạn xử lý thế nào?
66. Làm sao isolate issue giữa nhiều services?
67. Nếu environment shared và data conflict?

---

## 5. Automation Testing

68. Framework architecture của bạn gồm gì?
69. Vì sao cần Page Object Model?
70. BasePage dùng để làm gì?
71. Fixture là gì?
72. Test data management làm sao?
73. Vì sao hard wait là anti-pattern?
74. Locator strategy tốt nhất?
75. Làm sao design framework scalable?
76. Maintainability principles?
77. Reusability strategy?
78. Làm sao giảm flaky tests?
79. Parallel execution có risk gì?
80. UI vs API automation?
81. Khi nào automation không phù hợp?
82. Vì sao API automation thường preferred hơn UI?

### Scenario

83. Framework chạy rất chậm, optimize sao?
84. Automation pass local nhưng fail CI?
85. Nếu locator change liên tục?
86. Một test flaky nhưng business critical?

### Bổ sung — Automation Design & Reuse

167. Bạn quyết định test case nào nên automate?
168. Bạn structure reusable automation code như thế nào?
169. Bạn manage shared functions và test data ra sao?

---

## 6. Test Management & Tools

87. Workflow bug lifecycle trong Jira?
88. Bug report tốt cần gì?
89. TestRail/Zephyr dùng để làm gì?
90. Bạn trace testcase với requirement thế nào?
91. Git branching cơ bản?
92. Pull Request workflow?

### Scenario

93. Dev reject bug vì “cannot reproduce”?
94. Requirement ambiguous, bạn làm gì?
95. PO muốn close ticket nhưng QA chưa verify?

### Bổ sung — Test Plan, Report, Defect & Test Case Quality

170. Một Test Plan nên gồm những gì?
171. Một Test Summary Report (TSR/TCR) nên gồm những gì?
172. Bạn categorize và track defects như thế nào?
173. Điều gì tạo nên một test case tốt?
174. Bạn handle defect triage / root cause discussion ra sao?

---

## 7. CI/CD

96. CI/CD là gì?
97. Automation integrate CI/CD ra sao?
98. Smoke test nên chạy khi nào?
99. Regression nên chạy khi nào?
100. Vì sao cần parallel execution?
101. Bạn dùng reporting tools nào?
102. Trace/video/log giúp gì?
103. Test reporting quan trọng thế nào?

### Scenario

104. Pipeline fail nhưng local pass?
105. Nightly regression unstable?
106. Flaky tests trong CI xử lý sao?
107. Một failed test có block release không?

---

## 8. Communication & Collaboration

108. Bạn communicate bug với Dev thế nào?
109. Nếu disagreement với Dev?
110. Làm sao clarify requirement ambiguity?
111. Nếu designer và PO conflict requirement?
112. Bạn decide testcase nào automate thế nào?

### Single QA Scenario

113. Nếu bạn là QA đầu tiên trong team?
114. Bạn ưu tiên setup gì trước?
115. Metrics nào đo success?
116. Làm sao convince team invest automation?

---

## 9. AI Experience

117. Bạn dùng AI hỗ trợ QA thế nào?
118. AI có thể giúp generate testcase ra sao?
119. Risk của AI-generated tests?
120. Vì sao không nên trust hoàn toàn AI-generated automation?
121. Human verification strategy là gì?

### Scenario

122. AI generate locator sai, xử lý sao?
123. AI-generated testcase miss edge case?
124. Bạn validate AI output thế nào?
125. AI có thể thay QA không?

---

## Killer Questions

126. Bug nghiêm trọng nhất bạn từng gặp?
127. Automation challenge lớn nhất?
128. Bạn improve process gì trong team?
129. Một lần bạn disagree với requirement?
130. Điều gì làm một automation framework “good”?

---

## Middle-Level Mindset

131. Quality là trách nhiệm của ai?
132. Bạn prioritize testing thế nào?
133. Làm sao balance speed vs quality?
134. Khi nào nên stop testing?
135. “100% automation coverage” có tốt không?

---

## 10. Kafka & Event-Driven Testing

### General — Concepts

136. Kafka là gì? Khác message queue truyền thống (RabbitMQ/ActiveMQ) ở điểm nào?
137. Giải thích topic, partition, offset, consumer group.
138. Partition dùng để làm gì? Quan hệ với parallelism và ordering?
139. Producer quyết định message vào partition nào như thế nào?
140. Kafka đảm bảo ordering ở phạm vi nào? Làm sao giữ thứ tự cho nhóm message liên quan?
141. Điều gì có thể làm vỡ ordering dù đã set key đúng?
142. Delivery semantics: at-most-once / at-least-once / exactly-once khác nhau ra sao?
143. Vì sao at-least-once phổ biến? Hệ quả với QA là gì?
144. Consumer offset là gì? Auto-commit vs manual commit khác nhau thế nào?
145. auto.offset.reset (earliest vs latest) ảnh hưởng test ra sao?
146. Consumer group rebalance là gì? Khi nào xảy ra, ảnh hưởng gì?
147. Consumer lag là gì? Vì sao quan trọng? Đo bằng công cụ nào?
148. Retention vs log compaction khác nhau thế nào?
149. acks, ISR, min.insync.replicas liên quan tới durability ra sao?
150. Schema Registry và schema evolution là gì? Vì sao là nguồn bug tích hợp?
151. Điểm mạnh / điểm yếu của Kafka? Khi nào KHÔNG nên dùng?

### General — Testing

152. Test hệ thống dùng Kafka khác test REST API ở điểm nào?
153. Có những tầng/loại test nào cho hệ Kafka? Dùng tool gì?
154. Nguyên nhân gây flaky test khi test Kafka và cách phòng tránh?
155. Làm sao test ordering, duplicate, poison-pill (DLQ)?

### MDaaS Scenario

156. Mô tả cách test hệ scan file event-driven của bạn (end-to-end).
157. Bạn xác định “một request đã xử lý xong” như thế nào?
158. Vì sao consumer dùng group.id random mỗi lần chạy?
159. Bạn đảm bảo và verify ordering trong dự án ra sao?
160. Consumer merge nhiều partition/topic vào một datalog — thứ tự trong file có đáng tin không?
161. Vì sao cần cửa sổ chờ sau khi thấy progress_percentage == 100?
162. Vì sao tách consumer ra process riêng ghi datalog rồi test mới poll, thay vì consume trực tiếp trong test?
163. Hệ test của bạn CHƯA cover gì? Bạn sẽ bổ sung gì?
164. Bạn nói có test ordering — vậy có test idempotent producer / reorder-on-retry không?

---

## 11. Round 2 — Manager Interview (Behavioral & Process)

### Agile, Meeting & Documentation

175. Vai trò của QA trong Scrum team và trong từng ceremony (planning, standup, refinement, review, retro)?
176. QA nên bắt đầu tham gia từ giai đoạn nào trong một sprint? Vì sao?
177. Scrum khác Kanban thế nào? Bạn phù hợp với mô hình nào?
178. Definition of Done và Acceptance Criteria khác nhau thế nào? QA dùng chúng ra sao?
179. Bạn tạo và duy trì những tài liệu QA nào? Tài liệu nào quan trọng nhất?
180. Meeting nào bạn thấy giá trị nhất với QA và bạn đóng góp gì trong đó?

### Conflict & Stakeholder Management

181. Stakeholder của QA gồm những ai? Bạn điều chỉnh cách giao tiếp với mỗi bên ra sao?
182. Khi Dev khẳng định "không phải bug / máy tôi chạy ngon" thì bạn xử lý thế nào?
183. Deadline gấp, không đủ thời gian test hết — bạn xử lý và communicate thế nào?
184. Kể một lần bạn có xung đột trong công việc và cách bạn giải quyết (STAR).
185. Bất đồng về severity/priority của bug — bạn thuyết phục stakeholder thế nào?
186. Làm sao để Dev và team tin tưởng vào automation của bạn?

### Test Case Types trong SDLC, Automation & API

187. Phân biệt test levels (unit/integration/system/acceptance) và test types (smoke/sanity/regression).
188. Functional vs Non-functional testing khác nhau thế nào?
189. Bạn dùng những test case design technique nào? (EP, BVA, decision table, state transition)
190. Cùng một chức năng, khi nào bạn chọn test qua API, khi nào qua UI?
191. API testing kiểm tra những gì? Vì sao quan trọng trong SDLC?
192. Test Pyramid là gì và nó định hình chiến lược test của bạn ra sao?

### Motivation & Career Path

193. Điều gì tạo động lực cho bạn với nghề QA/Automation?
194. Career path của bạn trong 2–3 năm tới là gì?
195. Vì sao bạn sẵn sàng học Java? Học để làm gì?
196. "Support dev team" nghĩa là gì với bạn (ngoài việc report bug)?
197. Bạn đang và sẽ ứng dụng AI vào testing như thế nào?
198. Vì sao bạn muốn gia nhập team/công ty này? Bạn có câu hỏi gì cho manager?
