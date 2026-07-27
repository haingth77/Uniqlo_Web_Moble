# Jenkins vs Argo CD — CI, CD và GitOps

> Phân biệt hai công cụ hay đứng cạnh nhau trong chuỗi CI/CD với Kubernetes: ai làm build, ai làm deploy.
> Format: **Nó là gì → Mô hình → So sánh → Dùng cùng nhau thế nào**.

---

## 1. Jenkins là gì?

**Jenkins** là một **máy chủ tự động hóa** (automation server), dùng nhiều nhất cho **CI – Continuous Integration** và thường cả các bước **CD** (triển khai) khi bạn cấu hình pipeline.

- Bạn định nghĩa **job / pipeline**: build, test, đóng gói, chạy script, gọi API, deploy bằng script hoặc plugin.
- Chủ yếu là **mệnh lệnh** (*imperative*): bạn nói Jenkins **chạy lệnh gì, khi nào** (theo webhook, lịch, hoặc bấm tay).
- Có hệ sinh thái **plugin** rất lớn; có thể tích hợp hầu hết công cụ.
- **Không** lấy trạng thái mong muốn toàn cluster làm trung tâm: trung tâm là **các tác vụ** bạn cấu hình.

---

## 2. Argo CD là gì?

**Argo CD** là công cụ **GitOps** cho **Kubernetes**.

- Trạng thái mong muốn của ứng dụng được mô tả trong **Git** (YAML thuần, Helm, Kustomize, …).
- Argo CD **so sánh liên tục** nội dung Git với những gì **đang chạy trên cluster**, và có thể **đồng bộ (sync)** để cluster khớp với Git.
- Mô hình **khai báo** (*declarative*): **Git là nguồn sự thật**; Argo CD **điều chỉnh cluster** cho khớp.
- **Không** phải máy chủ build tổng quát: tập trung vào **triển khai và duy trì** ứng dụng trên K8s theo Git.

> [!IMPORTANT]
> Khác biệt cốt lõi: Jenkins **mệnh lệnh** (chạy step bạn định nghĩa), Argo CD **khai báo**
> (Git là nguồn sự thật, cluster được điều chỉnh cho khớp Git).

---

## 3. So sánh nhanh

| Tiêu chí | Jenkins | Argo CD |
|----------|---------|---------|
| Vai trò chính | CI (build, test), tự động hóa tổng quát | CD lên Kubernetes theo GitOps |
| Điểm mạnh | Pipeline linh hoạt, nhiều plugin | Đồng bộ cluster với Git, audit theo Git |
| Mô hình | Chạy bước / lệnh bạn định nghĩa | Đối chiếu và áp dụng trạng thái từ Git |

---

## 4. Thường dùng cùng nhau thế nào?

Luồng phổ biến:

1. **Jenkins**: build, chạy test, build và push **container image**, có thể cập nhật tag image hoặc manifest trong Git.
2. **Argo CD**: phát hiện thay đổi trên Git và **triển khai / cập nhật** workload trên Kubernetes.

Như vậy Jenkins lo phần **tích hợp và build**; Argo CD lo phần **triển khai và duy trì trạng thái** trên cluster theo Git.

> [!TIP]
> Với QA Automation: pipeline Jenkins là nơi chèn test stage (unit → API → E2E) và cổng chặn image xấu;
> Argo CD là nơi xác nhận **môi trường đang chạy đúng version nào** khi cần trace bug theo build.
