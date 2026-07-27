# Kafka cho Senior QA Automation

> [!NOTE]
> File này là **bản đồ kiến thức (overview)** — liệt kê các item cần biết, mối liên kết, điểm mạnh/yếu, và đặc biệt là **góc nhìn QA automation**: cái gì cần test, test thế nào, bug hay gặp ở đâu. Từ map này bạn đào sâu từng nhánh.

---

## 0. Vì sao QA cần hiểu Kafka

Khi dự án dùng Kafka, **logic nghiệp vụ không còn nằm trong 1 request-response HTTP** mà chảy qua nhiều service nối với nhau bằng message bất đồng bộ (async). Hậu quả với QA:

- Không thể test bằng cách "gọi API → assert response" thuần túy nữa. Action và effect **tách rời theo thời gian**.
- Phải biết verify **side-effect** (message được produce ra topic, được consume đúng, DB cập nhật sau cùng).
- Bug đặc thù event-driven: mất message, trùng message (duplicate), sai thứ tự (ordering), consumer lag, message "kẹt" (poison pill / DLQ).
- Test trở nên **eventually consistent** → phải dùng polling/await thay vì assert tức thì.

> [!IMPORTANT]
> Tư duy cốt lõi: Kafka biến hệ thống thành **asynchronous + distributed**. Mọi khó khăn khi test đều quy về 2 chữ này. Nắm chắc *delivery semantics* và *ordering guarantees* là quan trọng nhất cho QA.

---

## 1. Khái niệm nền tảng (Core Concepts)

### 1.1 Kafka là gì
Một **distributed event streaming platform** — về bản chất là một **commit log** phân tán, bền vững (durable), có thể replay. Không phải message queue truyền thống: message **không bị xóa sau khi đọc**, nó nằm lại trong log theo retention policy.

| Đặc điểm | Message Queue cũ (RabbitMQ, ActiveMQ) | Kafka |
|---|---|---|
| Sau khi consume | Message bị xóa | Message **giữ lại** (replay được) |
| Mô hình | Push tới consumer | Consumer **pull** |
| Vị trí đọc | Broker quản lý | **Consumer tự quản** bằng offset |
| Thông lượng | Vừa | **Rất cao** (triệu msg/s) |

### 1.2 Các thành phần (đi kèm nhau, học theo cụm)

- **Broker** — 1 server Kafka. Nhiều broker = **Cluster**. Liên kết → *replication*, *partition leadership*.
- **Topic** — kênh logic chứa message (vd `orders`, `payments`). Liên kết → *partition*.
- **Partition** — topic chia thành nhiều partition để scale & song song. **Đơn vị của parallelism và ordering**. Liên kết → *offset*, *consumer group*, *ordering*.
- **Offset** — số thứ tự tăng dần của message *trong 1 partition*. Liên kết → *consumer*, *commit*, *replay*.
- **Producer** — bên ghi message. Liên kết → *partitioner*, *acks*, *idempotence*.
- **Consumer** — bên đọc message. Liên kết → *consumer group*, *offset commit*, *rebalance*.
- **Consumer Group** — nhóm consumer cùng `group.id` chia nhau partition. Liên kết → *rebalance*, *parallelism*, *lag*.
- **Replication / ISR** — mỗi partition có 1 *leader* + N *follower*. **ISR** (In-Sync Replicas) = các replica bắt kịp leader. Liên kết → *acks*, *durability*, *min.insync.replicas*.
- **Coordinator: ZooKeeper → KRaft** — quản lý metadata, bầu leader. Kafka mới (3.x+) bỏ ZooKeeper, dùng **KRaft** (Raft nội bộ).

> [!TIP]
> Một câu nắm cả cụm: *"Producer ghi message vào 1 partition của topic; broker lưu & replicate; consumer trong 1 group đọc theo offset; offset được commit để biết đã đọc tới đâu."*

### 1.3 Cấu trúc 1 Message (Record)
Liên kết trực tiếp tới việc QA assert cái gì:

- **Key** — quyết định message vào partition nào (cùng key → cùng partition → **giữ thứ tự**). Rất quan trọng để test ordering.
- **Value** — payload (thường JSON/Avro/Protobuf).
- **Headers** — metadata (vd `correlation-id`, `trace-id` để truy vết).
- **Timestamp** — thời điểm tạo/append.
- **Offset + Partition** — vị trí, do broker gán.

> [!GOTCHA]
> Ordering **chỉ được đảm bảo trong 1 partition**, KHÔNG trên toàn topic. Nếu test yêu cầu thứ tự (vd event của cùng 1 order), producer phải set **key** giống nhau. Đây là bug ordering kinh điển QA cần soi.

---

## 2. Delivery Semantics (QUAN TRỌNG NHẤT với QA)

Quy định "message được giao bao nhiêu lần". Quyết định bạn phải test duplicate hay test mất mát.

| Semantic | Nghĩa | Rủi ro cần test | Cấu hình liên quan |
|---|---|---|---|
| **At-most-once** | ≤ 1 lần | **Mất message** | commit offset *trước* khi xử lý; `acks=0` |
| **At-least-once** | ≥ 1 lần (mặc định phổ biến) | **Trùng message (duplicate)** | commit *sau* khi xử lý; `acks=all` |
| **Exactly-once (EOS)** | đúng 1 lần | Phức tạp, có thể hiểu sai phạm vi | `enable.idempotence=true`, transactions, `isolation.level=read_committed` |

> [!IMPORTANT]
> Đa số hệ thống chạy **at-least-once** → nghĩa là **duplicate là chuyện bình thường**. Câu hỏi QA phải đặt cho dev: *"Consumer có idempotent không?"* Nếu xử lý cùng 1 message 2 lần mà tạo 2 order → **đó là bug**, và bạn phải có test case cho nó.

Khái niệm đi kèm:
- **Idempotent producer** (`enable.idempotence`) — chống duplicate do producer retry.
- **Idempotent consumer** — logic phía consumer tự khử trùng (dedup bằng key/event-id).
- **Transactions** — ghi nhiều partition/topic atomically (all-or-nothing).

---

## 3. Producer — những gì ảnh hưởng tới test

- **`acks`** — `0` (fire & forget, có thể mất), `1` (leader xác nhận), `all`/`-1` (toàn bộ ISR xác nhận → bền nhất). → liên kết *durability* / *min.insync.replicas*.
- **Partitioner** — quyết định partition: theo key (hash), round-robin, hoặc custom. → liên kết *ordering*.
- **Retries + idempotence** — retry có thể tạo duplicate nếu không bật idempotence.
- **Batching / linger.ms / compression** — gom message để tăng throughput; ảnh hưởng độ trễ → test performance/latency.

> [!GOTCHA]
> `acks=all` mà `min.insync.replicas` không đủ → producer **báo lỗi thay vì ghi**. Khi test resilience (kill broker), đây là điểm dễ "tưởng bug" nhưng thực ra là cấu hình đúng.

---

## 4. Consumer — nơi sinh nhiều bug nhất

### 4.1 Offset & Commit
- **Committed offset** = "đã xử lý xong tới đâu". Restart consumer sẽ đọc tiếp từ đây.
- **Auto-commit** (`enable.auto.commit=true`) tiện nhưng nguy hiểm: commit theo interval, có thể commit message **chưa xử lý xong** → mất message khi crash.
- **Manual commit** (sync/async) → kiểm soát chính xác, dùng cho at-least-once đúng nghĩa.
- **`auto.offset.reset`** — `earliest` (đọc từ đầu) vs `latest` (chỉ message mới) khi không có offset. **Cực kỳ quan trọng khi viết test consumer** — sai cái này test sẽ "không thấy message nào".

### 4.2 Consumer Group & Rebalance
- Mỗi partition chỉ được **1 consumer trong group** đọc tại 1 thời điểm.
- Số consumer > số partition → consumer thừa **ngồi không**. → giới hạn parallelism = số partition.
- **Rebalance** — khi consumer join/leave, partition được chia lại. Trong lúc rebalance, consume **tạm dừng** → ảnh hưởng độ trễ, có thể gây duplicate.

> [!GOTCHA]
> Rebalance storm (rebalance liên tục do `session.timeout`/`max.poll.interval` sai) là bug production phổ biến. Triệu chứng QA thấy: lag tăng vọt, throughput tụt. Liên kết → *consumer lag monitoring*.

### 4.3 Consumer Lag (chỉ số vàng của QA)
**Lag = log-end-offset − committed-offset** = số message chưa được consume. Đây là **metric quan trọng nhất** để biết hệ thống có theo kịp không.
- Lag tăng đều → consumer chậm / chết / rebalance.
- Test performance/soak: monitor lag để biết throughput đủ chưa.
- Công cụ: `kafka-consumer-groups.sh --describe`, Burrow, Kafka Lag Exporter, Prometheus.

---

## 5. Lưu trữ & Dữ liệu

- **Retention** — theo *time* (`retention.ms`) hoặc *size* (`retention.bytes`). Hết hạn → xóa. → ảnh hưởng *replay* và test: dữ liệu test có thể "biến mất".
- **Log Compaction** — giữ lại **message mới nhất cho mỗi key** (vd snapshot trạng thái). Khác với delete retention. → dùng cho topic kiểu "current state".
- **Tombstone** — message value = null, báo "xóa key này" trong compacted topic.
- **Replication factor** — số bản sao của partition (vd RF=3). RF + `min.insync.replicas` quyết định chịu được mất bao nhiêu broker.

> [!TIP]
> Khi test môi trường shared, retention ngắn có thể làm message test bị dọn trước khi assert. Dùng topic riêng cho test hoặc set retention phù hợp.

---

## 6. Hệ sinh thái (Ecosystem) — biết để định vị test scope

- **Schema Registry** — quản lý schema (Avro/Protobuf/JSON Schema) + **compatibility rules** (BACKWARD/FORWARD/FULL). → nền tảng cho **contract testing**. Liên kết → *serialization*, *schema evolution*.
- **Kafka Connect** — sink/source connector (DB ↔ Kafka) không cần code. → test: CDC (Debezium), data integrity.
- **Kafka Streams** — thư viện xử lý stream (join, aggregate, windowing) trong app Java. → test bằng `TopologyTestDriver`.
- **ksqlDB** — SQL trên stream.
- **Mirror Maker** — replicate giữa các cluster (multi-DC, DR).

> [!IMPORTANT]
> **Schema evolution** là nguồn bug tích hợp số 1 trong hệ Kafka: producer đổi schema, consumer cũ vỡ. QA nên đẩy việc này vào CI bằng **contract test + schema compatibility check** thay vì phát hiện ở production.

---

## 7. Điểm mạnh / điểm yếu

### Điểm mạnh
- **Throughput cực cao** + horizontal scale (thêm partition/broker).
- **Durable & replayable** — message lưu trên đĩa, replay được → tốt cho event sourcing, audit, reprocess.
- **Decoupling** producer/consumer → nhiều consumer độc lập đọc cùng data.
- **Ordering theo partition** + delivery guarantees linh hoạt.

### Điểm yếu / chi phí
- **Phức tạp vận hành** (cluster, ZK/KRaft, tuning) → khó dựng môi trường test.
- **Không phải hàng đợi tác vụ** truyền thống: không có per-message ack/priority/TTL như RabbitMQ; làm DLQ/retry phải tự build.
- **Ordering toàn cục không có** — chỉ trong partition.
- **Eventually consistent** → test khó, dễ flaky nếu assert sai thời điểm.
- **Không query được như DB** — muốn tìm 1 message phải scan/consume.

---

## 8. GÓC NHÌN QA AUTOMATION — Test cái gì & Test thế nào

### 8.1 Các tầng test
1. **Component test (1 service)** — service đọc/ghi Kafka đúng không? Dùng **embedded/Testcontainers Kafka**.
2. **Contract test** — schema producer ↔ consumer tương thích (Schema Registry compatibility, hoặc Pact for async).
3. **Integration / E2E** — chuỗi nhiều service: produce ở đầu → assert side-effect ở cuối (DB, topic khác, API).
4. **Non-functional** — throughput, latency, **consumer lag dưới tải**, resilience (kill broker, network partition).

### 8.2 Test harness điển hình (automation)
- **Produce test message** vào topic input bằng client (kafkajs / confluent-kafka / Spring Kafka test).
- **Consume & assert** ở topic output — dùng **awaitility / polling** (KHÔNG dùng sleep cứng).
- **Verify side-effect**: poll DB/API tới khi đạt trạng thái mong đợi hoặc timeout.

> [!IMPORTANT]
> Vì Kafka async → **mọi assertion phải là "await until / poll with timeout"**, không assert tức thì. `sleep(3000)` là anti-pattern: vừa flaky vừa chậm. Dùng retry-until-condition (Awaitility, `expect.poll`, vitest `vi.waitFor`).

### 8.3 Công cụ thường dùng
- **Testcontainers** (`KafkaContainer`) — dựng Kafka thật trong Docker cho test, dọn sạch sau test. Tốt nhất cho integration.
- **Embedded Kafka** (Spring `@EmbeddedKafka`) — nhanh, in-process, cho unit/component (JVM).
- **`TopologyTestDriver`** — test Kafka Streams không cần broker.
- **CLI**: `kafka-console-producer/consumer`, `kafka-consumer-groups`, `kcat` (kafkacat) — debug & verify thủ công.
- **UI**: AKHQ, Conduktor, Kafka UI, Redpanda Console — quan sát topic/lag/message.
- **Client lib**: kafkajs (Node), confluent-kafka-python, Spring Kafka.

### 8.4 Checklist test case đặc thù Kafka
- ✅ **Happy path**: produce → consume → side-effect đúng.
- ✅ **Duplicate**: gửi cùng message 2 lần → hệ thống idempotent (không tạo 2 record).
- ✅ **Ordering**: nhiều event cùng key → xử lý đúng thứ tự.
- ✅ **Out-of-order / late event**: event đến trễ → xử lý ra sao.
- ✅ **Poison pill**: message lỗi schema/parse → vào **DLQ**, không kẹt cả partition.
- ✅ **Consumer restart**: kill giữa chừng → resume từ offset đúng, không mất/không trùng.
- ✅ **Rebalance**: scale consumer up/down → không mất message.
- ✅ **Schema evolution**: thêm field optional → consumer cũ vẫn chạy.
- ✅ **Lag dưới tải**: bơm N msg/s → lag không tăng vô hạn.
- ✅ **Broker failure**: kill 1 broker (RF≥2) → không mất message.

> [!GOTCHA]
> **Flaky test** là kẻ thù lớn nhất khi test Kafka. Nguyên nhân hay gặp: (1) assert quá sớm (chưa consume xong), (2) `auto.offset.reset` sai nên không thấy message, (3) consumer group dùng lại `group.id` cũ → đọc nhầm offset, (4) topic chưa được dọn giữa các test → dữ liệu rò rỉ. Mỗi test nên có **group.id / topic độc lập** hoặc dọn sạch.

### 8.5 DLQ & Error handling (rất hay bị bỏ sót)
- **Dead Letter Queue** — message xử lý fail nhiều lần → đẩy sang topic DLQ để không chặn partition.
- **Retry topic** — pattern retry có backoff (Spring Kafka `@RetryableTopic`).
- QA cần test: message lỗi **có vào DLQ không**, partition **không bị kẹt**, và **alert** có bắn không.

---

## 9. Bản đồ liên kết nhanh (mind-map dạng text)

```
Topic ──split──> Partition ──ordered by──> Offset
                    │                         │
              parallelism                committed by
                    │                         │
              Consumer Group <──reads── Consumer ──manages──> Offset commit
                    │                                              │
                rebalance                                   auto vs manual
                    │
Producer ──key──> Partitioner ──> Partition (ordering!)
   │
  acks ──> ISR / min.insync.replicas ──> Durability
   │
 idempotence + transactions ──> Exactly-once

Delivery semantics ─┬─ at-most-once  (mất msg)
                    ├─ at-least-once (duplicate ← QA test idempotency)
                    └─ exactly-once  (transactions)

Schema Registry ──> compatibility ──> Contract test / Schema evolution
Kafka Connect / Streams / ksqlDB ──> ecosystem (định vị scope test)
Retention / Compaction ──> ảnh hưởng replay & data trong test
Consumer Lag ──> metric vàng để đánh giá throughput & sức khỏe
```

---

## 10. Gợi ý các hướng đào sâu tiếp (để bạn hỏi)

1. **Delivery semantics & idempotency** — cách thiết kế test case duplicate, exactly-once thực sự nghĩa là gì.
2. **Testcontainers Kafka** — viết integration test thực tế (Node/kafkajs hoặc Java/Spring).
3. **Contract testing** với Schema Registry — đưa schema compatibility vào CI.
4. **Consumer lag & performance test** — đo lag dưới tải, soak test.
5. **Resilience testing** — kill broker, rebalance, poison pill, DLQ.
6. **Chiến lược chống flaky** — polling/awaitility, isolation topic & group.id.
7. **Observability** — trace-id qua headers, end-to-end tracing trong hệ event-driven.

> [!TIP]
> Lộ trình đề xuất cho senior QA: **(2) Delivery semantics → (8.4) Checklist test case → Testcontainers harness → Lag/Resilience → Contract test**. Đây là thứ tự từ "hiểu để test đúng" đến "tự động hóa & đưa vào CI".

---

## 11. Phỏng vấn — Q&A bám dự án thực tế (MDaaS)

> [!NOTE]
> Phần này build trên một dự án có thật: hệ scan file **event-driven qua Kafka**. Producer dùng **`request_id` làm partition key**. Test produce 1 scan request → một consumer riêng (`node index.js -a consume`) gom result message theo `request_id` vào file datalog → Playwright test **poll datalog tới khi gặp terminal event `progress_percentage == 100`** → verify payload bản ghi cuối (như verify response body API). Có assert ordering: chuỗi `progress_percentage` của 1 request phải **tăng dần đơn điệu**.

### 11.1 "Elevator pitch" — mô tả dự án trong 30 giây
> "Hệ thống là pipeline scan file bất đồng bộ. Test produce một request kèm `request_id` (dùng làm **partition key**) vào topic `scan`. Engine xử lý và phát các result message lên topic `scan-result-*`. Một consumer riêng gom message theo `request_id`, test **poll cho tới khi gặp terminal event `progress_percentage == 100`**, rồi verify payload — tương tự verify response body, nhưng async nên dùng **poll-until** thay vì assert tức thì. Tôi cũng assert ordering ở mức nghiệp vụ: `progress_percentage` phải tăng dần đơn điệu."

---

### NHÓM A — Hiểu nền tảng

**Q: Vì sao test Kafka khác test REST API?**
> Action và effect **tách rời theo thời gian** (async). Không thể "gọi → assert response" ngay. Phải verify **side-effect** (message lên topic, datalog cập nhật) và assert theo kiểu **eventually consistent**: poll-until-condition với timeout, không assert tức thì, không `sleep` cứng.

> [!GOTCHA]
> Bẫy theo sau: *"sleep cứng có được không?"* → Không. Vừa flaky vừa chậm. Đúng là **poll tới điều kiện** (gặp `progress_percentage == 100`) hoặc timeout — đúng như `getKafkaObjectById_allResult` đang làm.

**Q: Topic, partition, offset, consumer group — giải thích nhanh.**
> Topic = kênh logic; chia thành partition (đơn vị song song + thứ tự); offset = số thứ tự message trong 1 partition; consumer group = nhóm chia nhau partition, mỗi partition chỉ 1 consumer trong group đọc.

---

### NHÓM B — Ordering (điểm mạnh của bạn, hay bị hỏi xoáy)

**Q: Bạn đảm bảo ordering bằng cách nào?**
> Producer set **key = `request_id`** → mọi message cùng request rơi vào **cùng partition** → Kafka giữ thứ tự trong partition theo offset. Một consumer đọc partition đó tuần tự nên giữ nguyên thứ tự. Tôi assert ở mức nghiệp vụ: `progress_percentage` phải **monotonic non-decreasing** (`verifyItemOfArray_IsSorted`).

**Q (xoáy): Ordering của Kafka là toàn topic hay chỉ trong partition?**
> **Chỉ trong partition.** Toàn topic KHÔNG có. Đó chính là lý do phải dùng key — để gom các message cần thứ tự về cùng partition.

**Q (xoáy): Consumer của bạn merge nhiều partition/nhiều topic vào 1 datalog. Vậy thứ tự trong file có đáng tin không?**
> Thứ tự **toàn cục** trong file không đáng tin (merge nhiều partition). Nhưng tôi **chỉ assert ordering trong phạm vi 1 `request_id`**, mà các message đó cùng 1 partition → thứ tự được giữ. Tôi không bao giờ dựa vào thứ tự giữa các request khác nhau.

**Q (xoáy chí mạng): Điều gì có thể làm vỡ ordering dù đã set key đúng?**
> Ba chỗ: (1) **Producer** — `max.in.flight > 1` + retry mà KHÔNG bật `enable.idempotence` → retry có thể ghi sai thứ tự; (2) **Reshard** — đổi số partition làm `hash(key)%N` đổi, cùng key sang partition khác; (3) **Consumer** — nếu xử lý đa luồng/async thì đọc đúng thứ tự nhưng side-effect ra sai thứ tự.

> [!IMPORTANT]
> Trong consumer dự án này `maxInFlightRequests: 5` + có retry. Với **consumer** thì in-flight không phá ordering đọc (đọc tuần tự theo offset trong partition). Nhưng đây là kiến thức để bạn nói về **phía producer** — nơi `max.in.flight` + retry mới thực sự gây reorder, và cần `enable.idempotence` để vá.

---

### NHÓM C — Delivery semantics & duplicate

**Q: Hệ thống của bạn at-least-once hay exactly-once?**
> Mặc định Kafka phổ biến là **at-least-once** → **duplicate là chuyện bình thường**. Câu hỏi đúng phải đặt: consumer có **idempotent** không?

**Q (xoáy): Nếu nhận trùng terminal event (`progress_percentage == 100`) hai lần thì test/hệ thống có sai không?**
> Phải kiểm tra. Nếu logic verify chỉ đọc bản ghi cuối theo `request_id` thì duplicate terminal event **không làm sai assertion** (vẫn cùng payload). Nhưng nếu phía hệ thống tạo **2 kết quả** cho cùng request → đó là bug idempotency. Hiện tôi **chưa có test case chủ động cho duplicate** — đó là khoảng trống tôi muốn bổ sung (replay 1 message và verify không nhân đôi kết quả).

**Q: Phân biệt at-most-once vs at-least-once theo thời điểm commit offset.**
> Commit **trước** khi xử lý → crash giữa chừng → mất message = at-most-once. Xử lý xong **rồi** commit → crash trước commit → đọc lại → trùng = at-least-once.

---

### NHÓM D — Consumer / offset / test isolation

**Q: Consumer của bạn dùng `group.id` thế nào? Vì sao?**
> Mỗi lần chạy tạo **`group.id` random** (`file-scan-result-msg-auto-kafka-${makeid(3)}`). Lý do: tránh dùng lại offset cũ của lần chạy trước → mỗi lần test bắt đầu sạch, không bị "đã commit nên không đọc lại". Đây là **test isolation** ở tầng consumer group.

**Q (xoáy): `auto.offset.reset` ảnh hưởng gì tới test của bạn?**
> Group mới chưa có offset → giá trị `auto.offset.reset` quyết định đọc từ đầu (`earliest`) hay chỉ message mới (`latest`). Vì consumer của tôi **chạy trước rồi mới produce**, message cần đọc là message mới → hoạt động đúng. Nếu cấu hình sai (`latest` nhưng produce trước khi consumer kịp join) → test "không thấy message nào", một nguồn flaky kinh điển.

**Q: Vì sao tách consumer (`index.js`) ra process riêng, ghi datalog file, rồi test mới poll file — thay vì consume trực tiếp trong test?**
> **Decoupling**: consumer chạy dài, gom liên tục; test chỉ là bên đọc, đơn giản và ổn định hơn. Đổi lại có **race condition file I/O** giữa ghi và đọc — nên code có **batch-write theo interval** để giảm tranh chấp. Trade-off: thêm độ trễ và một điểm phức tạp; nếu làm lại tôi cân nhắc consume in-test bằng Testcontainers cho test cô lập.

---

### NHÓM E — Chiến lược test & chống flaky

**Q: Bạn xác định "request đã xong" bằng cách nào?**
> Terminal event: main file đạt `progress_percentage == 100`, **cộng** đối chiếu đủ child file (`files_in_archive`) và sanitized file (theo `original_id`), **cộng** cửa sổ chờ 10s cho **late arrival** (file sanitize trả sau). Chỉ khi đủ mới coi là complete rồi mới verify.

**Q (xoáy): Vì sao cần cửa sổ chờ 10s sau khi thấy 100%?**
> Vì các message phụ (sanitized/child) có thể **đến sau** terminal event của main file. Nếu assert ngay lúc thấy 100% sẽ **thiếu dữ liệu** → false negative. Đây là xử lý **out-of-order / late event** ở mức ứng dụng.

**Q: Các nguồn flaky khi test Kafka và cách bạn chặn?**
> (1) Assert quá sớm → dùng poll-until; (2) `auto.offset.reset` sai → consumer chạy trước produce; (3) dùng lại `group.id` → random group mỗi lần; (4) datalog rò rỉ giữa các test / race file I/O → batch-write + lọc chặt theo `request_id` random; (5) late arrival → cửa sổ chờ.

---

### NHÓM F — Giới hạn & hướng mở rộng (tín hiệu SENIOR)

**Q: Hệ thống test của bạn CHƯA cover gì? Sẽ thêm gì?**
> Trung thực liệt kê:
> - **Duplicate / idempotency** — replay message, verify không tạo kết quả nhân đôi.
> - **Consumer lag dưới tải** — bơm N request/s, đo lag không tăng vô hạn (`kafka-consumer-groups --describe`).
> - **Resilience** — kill broker (RF≥2), verify không mất message; rebalance khi scale consumer.
> - **DLQ / poison pill** — message lỗi schema có vào DLQ không, partition có bị kẹt không.
> - **Schema evolution / contract test** — đẩy compatibility check vào CI để producer đổi schema không làm vỡ consumer.

> [!TIP]
> Công thức trả lời "senior": **(1) việc thật đang làm → (2) ánh xạ đúng khái niệm Kafka → (3) chủ động nêu giới hạn + cái sẽ thêm.** Người chỉ nói "consume rồi verify" dừng ở (1); bạn đi tới (3).

**Q (cạm bẫy): Bạn nói có test ordering — vậy bạn có test idempotent producer / reorder-on-retry không?**
> **Không** — tôi là **consumer-only**, không điều khiển producer config. Tôi assert ordering **mức nghiệp vụ** (progress monotonic), dựa trên đảm bảo Kafka rằng cùng key → cùng partition → giữ thứ tự. Việc verify `enable.idempotence` / hành vi reorder-on-retry phía producer nằm ngoài phạm vi hiện tại.

> [!IMPORTANT]
> Đừng overclaim. Nói đúng "ordering mức nghiệp vụ" thay vì "test ordering guarantee của Kafka" là khác biệt giữa ứng viên trung thực-có-chiều-sâu và ứng viên bị bắt bài.

---

### 11.2 Bảng ánh xạ: việc bạn làm ↔ khái niệm Kafka (học thuộc để trả lời nhanh)

| Việc trong dự án | Khái niệm Kafka / QA |
|---|---|
| Lọc message theo `request_id` | Correlation ID; key = partition key → ordering per request |
| Poll datalog tới khi thấy `progress_percentage == 100` | Eventually-consistent assertion; terminal event; poll-until |
| Cửa sổ chờ 10s sau 100% | Xử lý late arrival / out-of-order |
| `group.id` random mỗi lần chạy | Test isolation ở consumer group; tránh offset cũ |
| Consumer chạy trước, produce sau | Liên quan `auto.offset.reset` (latest) |
| `verifyItemOfArray_IsSorted(progress_percentage)` | Assert ordering trong 1 partition |
| Verify payload bản ghi cuối | Output contract verification (như response body) |
| Batch-write datalog | Giảm race condition I/O; trade-off độ trễ |
| Consume nhiều topic priority (low/normal/high) | Partition/topic routing theo độ ưu tiên |
