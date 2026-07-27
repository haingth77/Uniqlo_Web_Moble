# Dockerized Playwright Test Runner trên K8s + GitHub Actions CI

> Mục tiêu: hiểu & trình bày flow **"AI-SDLC Dockerized Playwright test runner"** — một **Kubernetes Job** clone code từ 1 branch, chạy API/Kafka Playwright test trên **EKS**, rồi đính report lên **Jira ticket**; một **GitHub Actions** workflow trigger nó mỗi khi có PR và gate PR theo kết quả. Dùng cho phỏng vấn SDET/DevOps-in-QA.
> Nguồn: `AutomationApp/k8s/autotest-job.yaml`, `Dockerfile.base`, `scripts/docker-entrypoint.sh`, `scripts/upload-report-jira.mjs`, `.github/workflows/autotest-pr.yml`.
> **Format: Nó là gì → Khái niệm nền → Kiến trúc → Thành phần → Luồng chạy → Quyết định thiết kế → CI → Gotcha → Q&A**.

---

## 1. Một câu là gì?

Một **Kubernetes Job** (run-to-completion) chạy trên cluster EKS: một **initContainer** git-clone branch cần test vào volume dùng chung, rồi **container chính** (image nền trên ECR) chạy `npm install` → consumer Kafka → `npx playwright test` → zip report → đính kèm + comment lên Jira. **GitHub Actions** đứng ngoài, mỗi PR sẽ *submit Job này lên cluster*, chờ nó xong và **set trạng thái check của PR** (đỏ nếu test fail).

> [!KEY]
> **Máy/CI chỉ "gửi đơn" — cluster mới "làm việc".** `kubectl create` chỉ gửi manifest lên API server; toàn bộ clone + test chạy trên node EKS bằng CPU/RAM của cluster. Runner/laptop chỉ điều khiển từ xa và xem log.

---

## 2. Khái niệm nền

### 2.1 Job vs Deployment (chọn đúng primitive)

| | **Job** | **Deployment** |
|---|---|---|
| Mục đích | làm 1 việc **rồi dừng** (run-to-completion) | giữ service **sống mãi** (desired state) |
| Container exit | coi là **xong** ✅ | coi là **hỏng** → restart ♻️ (lặp vô hạn) |
| `restartPolicy` | `Never`/`OnFailure` | luôn `Always` (ép cứng) |
| Biết pass/fail? | có (`.status.succeeded` + exit code) | không có khái niệm đó |
| Hợp cho | test, migration, batch | web/API, consumer nền |

> [!KEY]
> Test là **run-to-completion** → phải là **Job**. Dùng Deployment sẽ chạy test → exit → bị coi là "hỏng" → **restart lặp vô tận**, và không có "pass/fail". Deployment chỉ hợp nếu đổi mô hình sang "warm runner" (pod đứng sẵn, bắn test vào).

### 2.2 initContainer + emptyDir (tách "lấy code" khỏi "chạy code")

- **initContainer** chạy **trước và tới khi hoàn tất** mới tới container chính. Ở đây nó git-clone branch vào volume `code` (kiểu `emptyDir`).
- **emptyDir** = thư mục tạm, **sống theo pod** (pod chết là mất). Dùng để chia sẻ code giữa init và main container.
- Image nền **không chứa code** → mỗi run clone code mới nhất từ GitHub. Image "sạch", hiếm rebuild.

### 2.3 envsubst + whitelist (truyền biến vào manifest)

Manifest để các **placeholder** `${GIT_BRANCH}`, `${TEST_ENV}`, `${JIRA_TICKET}`, `${TEST_PATTERN}`, `${TEST_GREP}`. Lúc submit, `envsubst` thay giá trị thật.

> [!GOTCHA]
> **Phải giới hạn envsubst đúng các biến này.** `envsubst` trần thay **mọi** `${VAR}` → sẽ nuốt luôn `$GIT_TOKEN` (biến runtime trong pod) thành rỗng → clone fail. Luôn: `envsubst '${GIT_BRANCH} ${TEST_ENV} ...'` (truyền shell-format whitelist).

### 2.4 Truy cập EKS: xác thực ≠ phân quyền

Chạm được cluster cần **2 lớp tách biệt**:
1. **IAM** (AWS) — xác thực + quyền `eks:DescribeCluster` để lấy token.
2. **EKS access entry + RBAC** (K8s) — map IAM principal vào 1 group K8s có quyền (create jobs, get pods/log).

> [!IMPORTANT]
> **IAM auth pass KHÔNG đồng nghĩa được phép `kubectl`.** Có key hợp lệ mà chưa map access entry → `kubectl` báo **Unauthorized**. Đây là lỗi hay gặp nhất khi setup cả người dùng lẫn CI.

### 2.5 Kafka theo môi trường (MSK)

`index.js` có map `KAFKA_SERVER[env]`. `TEST_ENV` chọn broker:

| env | MSK | reach từ dev cluster? |
|---|---|---|
| `dev` | `<dev-msk>` | ✅ có |
| `qa` | `<integration-msk>` (account Integration) | ❌ **khác VPC → timeout** |

> [!GOTCHA]
> `key.properties` chỉ có key `QA_/STAG_/PROD_`, **không có `DEV_`**. Bộ nhất quán là `qa` (QA keys + integration MSK) — nhưng integration MSK **không reach được từ dev cluster**. Muốn chạy env `qa` thật phải chạy Job trong **cluster integration** (cùng VPC với MSK đó).

---

## 3. Kiến trúc

```
GitHub PR  (feature -> release/x.y.z  hoặc  -> master)
   │  .github/workflows/autotest-pr.yml  (GitHub-hosted runner)
   ▼
[runner]
   ├─ auth: static IAM key (secrets AWS_ACCESS_KEY_ID/SECRET) -> aws eks update-kubeconfig
   ├─ parse PR description: jira-ticket / test-env / test-grep / test-pattern
   └─ envsubst  <manifest>  |  kubectl create -n <namespace>
                                   │
                                   ▼  EKS cluster (<eks-cluster>)
                          ┌── Job / Pod  (namespace <namespace>) ───────────────┐
                          │  initContainer git-clone : clone branch -> /app  │
                          │  container tests (ECR image):                    │
                          │    npm ci || npm install                         │
                          │    node index.js -e <env> -a consume  (Kafka)    │
                          │    npx playwright test <pattern>                 │
                          │    zip report -> attach + comment Jira           │
                          └──────────────────────────────────────────────────┘
   │  runner: kubectl logs -f + chờ Job
   ▼
Job Complete -> PR check xanh   |   Job Failed -> PR check đỏ (gate)
```

Điểm cốt lõi: **manifest** đọc **local lúc `kubectl create`** (không bao giờ clone); **scripts** thì **được clone vào pod** và chạy trong đó.

---

## 4. Thành phần

| File | Clone vào pod? | Vai trò |
|---|---|---|
| `Dockerfile.base` | ❌ (build-time) | Image nền: `node:20-slim` + `p7zip` + `unrar` + `ca-certificates`. Không có browser, không có code. |
| `k8s/autotest-job.yaml` | ❌ (đọc lúc `kubectl create`) | Định nghĩa Job: initContainer clone + container tests. Có placeholder envsubst. |
| `scripts/docker-entrypoint.sh` | ✅ | Chạy trong pod: npm install, consumer, playwright, zip + gọi uploader. |
| `scripts/upload-report-jira.mjs` | ✅ | node fetch: attach report zip + post ADF comment lên Jira. |
| `.gitattributes` | ✅ | ép `*.sh`/`*.mjs` = LF (container cần LF). |
| `.github/workflows/autotest-pr.yml` | ❌ (chạy trên runner) | Trigger Job trên PR vào `release/**` + `master`, gate PR. |

**3 secret trong namespace `<namespace>`** (tạo 1 lần): `<ns>-git` (GitHub token), `<ns>-key-properties` (file key.properties), `<ns>-secrets` (`.env` + JIRA/ZEPHYR + AWS keys).

> [!GOTCHA]
> `kubectl create secret` **không cho trộn** `--from-env-file` với `--from-literal`. Muốn gộp: tạo 1 file env tổng (grep bỏ key trùng rồi append) và `--from-env-file` file đó.

---

## 5. Luồng chạy

### 5.1 Biến môi trường: 1 input `TEST_ENV` điều khiển tất cả

`TEST_ENV` suy ra cả hai để **không lệch nhau**:
- consumer CLI: `node index.js -e <lowercase>` → chọn Kafka broker.
- test: `export ENV=<UPPERCASE>` → chọn API key `<ENV>_*`.

### 5.2 Chạy tay

```bash
export AWS_PROFILE=qa                       # sau aws sso login --profile qa
GIT_BRANCH="<branch>" TEST_ENV="dev" JIRA_TICKET="PROJ-1234" \
TEST_PATTERN="tests/<suite>/<module>/av.workflow.spec.ts" TEST_GREP="" \
  envsubst '${GIT_BRANCH} ${TEST_ENV} ${JIRA_TICKET} ${TEST_PATTERN} ${TEST_GREP}' \
  < k8s/autotest-job.yaml | kubectl create -n <namespace> -f -
kubectl logs -f job/<job-name> -n <namespace>
```

> [!TIP]
> Dùng `kubectl create` (không `apply`) vì manifest dùng `generateName` (không có tên cố định). Branch được clone **phải chứa** `scripts/` + manifest — Job kéo code từ GitHub, không phải từ local.

### 5.3 Report → Jira: attachment ≠ comment

- **Attach**: `POST /rest/api/3/issue/<key>/attachments` (Basic auth, header `X-Atlassian-Token: no-check`) → hiện ở mục **Attachments**.
- **Comment**: `POST /rest/api/3/issue/<key>/comment` với body **ADF** (Jira Cloud v3 bắt buộc ADF, không nhận plain text) → hiện ở **Activity/Comments**.

> [!GOTCHA]
> Jira giới hạn attachment **100MB**. Report full (cả `trace/` + `playwright-report.json`) từng lên **574MB** → fail HTTP 400. Fix: zip **loại `trace/` + file json to**, và **size-guard** trong uploader (bỏ attach nếu >100MB, comment vẫn ghi rõ).

---

## 6. Quyết định thiết kế

| Quyết định | Vì sao |
|---|---|
| **Job**, không Deployment | test run-to-completion; cần pass/fail; không muốn restart lặp |
| **initContainer clone + emptyDir** | tách "lấy code" khỏi "chạy code"; image nền sạch, hiếm rebuild |
| **`npm ci \|\| npm install`** | `npm ci` fail khi lock lệch package.json → fallback để pipeline không gãy |
| **upload bằng node fetch** | image slim **không có curl**; node 20 có sẵn `fetch`/`FormData` |
| **`backoffLimit: 0`** | test fail (exit 1) là **kết quả hợp lệ**, KHÔNG retry (retry = chạy lại full suite, tốn) |
| **`safe-to-evict:false` + `karpenter.sh/do-not-disrupt:true`** | cluster dev consolidate node liên tục → giết pod giữa test; chặn cả 2 loại autoscaler |
| **`terminationGracePeriodSeconds: 120`** | nếu vẫn bị terminate, cho cleanup kịp zip + upload Jira (mặc định 30s không đủ) |
| **1 input `TEST_ENV`** | tránh consumer (`-e`) và test (`ENV`) lệch môi trường |

---

## 7. GitHub Actions CI

- **Trigger**: `pull_request` (opened/synchronize/reopened) với `branches: ['release/**', master]` — lọc theo **branch ĐÍCH (base)** của PR.
- **Auth**: static IAM key (user `<ci-iam-user>`) lưu ở GitHub **secrets** `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`. (OIDC cũng khả thi vì account đã có provider `token.actions.githubusercontent.com`, nhưng DevOps cấp key tĩnh.)
- **Input động — đọc HẾT từ PR description** (mỗi dòng `key: value`):
  - `jira-ticket:` → JIRA_TICKET (fallback: tên branch grep `PROJ-\d+`)
  - `test-env:` → TEST_ENV (fallback `dev`)
  - `test-grep:` → TEST_GREP
  - `test-pattern:` → TEST_PATTERN (fallback: file `*.spec.ts` đổi trong PR → default scope)
- **Gate**: runner chờ Job, exit non-zero nếu Job Failed → PR check đỏ.

> [!IMPORTANT]
> **Với `pull_request`, GitHub chạy workflow từ HEAD của PR.** Nên fix trên feature branch có tác dụng ngay cho PR đó. Nhưng để **feature branch tương lai** (fork từ release/master) có sẵn workflow, phải merge nó vào release branch + master.

---

## 8. Gotchas (những bức tường đã đâm)

> [!GOTCHA]
> **git clone auth**: token phải nằm trong URL `https://x-access-token:$TOKEN@github.com/...`, **KHÔNG** dùng `Authorization: Bearer` (Bearer không work cho `git clone`). Token = classic PAT scope `repo` + **SSO-authorize** cho org, hoặc fine-grained PAT được org duyệt.

> [!GOTCHA]
> **CRLF giết script**: file `.sh`/`.mjs`/workflow `.yml` phải là **LF**. CRLF → bash lỗi `$'\r': command not found`. Thêm `.gitattributes` (`*.sh eol=lf`, `*.mjs eol=lf`).

> [!GOTCHA]
> **File phải push lên branch được clone**: Job kéo code từ GitHub, file local/untracked không có trong pod. (Manifest là ngoại lệ: đọc local lúc `kubectl create`.)

> [!GOTCHA]
> **404 ≠ 403 từ GitHub API**: token hợp lệ mà trả **404** trên repo = **không có quyền** repo đó (org chưa duyệt / cấp sai), không phải "không tồn tại".

> [!GOTCHA]
> **grep `[^\r\n]` bị hiểu literal**: vài bản grep hiểu `[^\r\n]` là "trừ ký tự `\`, `r`, `n`" → cắt value ở chữ `r`/`n` đầu tiên (`av.workflow` → `av.wo`). Fix: grep **nguyên dòng** rồi `sed` cắt prefix, đừng dùng `[^\r\n]`.

> [!GOTCHA]
> **SSO token hết hạn** (vài giờ/ngày) → `aws sso login --profile qa`. Nếu có static key cũ trong env → `unset AWS_ACCESS_KEY_ID/SECRET/SESSION_TOKEN` (nó đè profile).

> [!GOTCHA]
> **Timezone Jira**: mọi thứ chạy UTC (runner/pod/`date`), Jira lưu UTC nhưng **hiển thị theo múi giờ account** (US) → run 04:41 UTC ngày 21 hiện thành "11:31 PM ngày 20". Không phải bug.

> [!GOTCHA]
> **Đổi tên folder `AutomationAppLegacy` → `AutomationApp`**: master đã rename, release/feature branch cũ chưa. Không merge branch cũ vào master trực tiếp (conflict rename cả cây). Cách đúng: branch mới từ master, đặt file CI dưới `AutomationApp/`, chỉ ADD → không conflict.

---

## 9. Q&A ôn tập

**Q: Vì sao Job chứ không Deployment?**
Test là run-to-completion, cần biết pass/fail và không được restart. Deployment ép `restartPolicy: Always` → chạy lại vô tận, không có completion semantics.

**Q: Manifest có cần push lên branch không?**
Không. Manifest đọc **local** lúc `kubectl create`. Chỉ **scripts** (entrypoint, uploader) cần push vì được **clone vào pod**.

**Q: CI xác thực EKS kiểu gì mà không cần secret dài hạn... nhưng ở đây lại dùng key tĩnh?**
EKS endpoint public + account có sẵn GitHub OIDC provider → **OIDC assume-role** là chuẩn (không secret). Ở đây DevOps cấp **static IAM key** nên workflow dùng `AWS_ACCESS_KEY_ID/SECRET` từ GitHub secrets. Cả 2 cách vẫn cần **EKS access entry** map principal vào RBAC.

**Q: Vì sao pod bị "Killing" giữa test dù đã có `safe-to-evict`?**
`safe-to-evict` chỉ cluster-autoscaler đọc. Cluster dùng **Karpenter** → phải thêm `karpenter.sh/do-not-disrupt: "true"`. (Spot reclaim / node hard-death thì annotation không cứu được — cần on-demand node.)

**Q: Report không lên Jira dù ticket đúng — vì sao?**
Kiểm tra theo thứ tự: (1) pod có tới `cleanup`/Jira block không (bị giết giữa chừng thì không) → (2) report zip có tạo được không → (3) size >100MB → (4) creds Jira. Upload nằm ở cleanup cuối; pod bị SIGKILL thì trap không chạy.

**Q: Làm sao 1 workflow chạy cho cả 2 tên folder (migration)?**
Auto-detect `APP_DIR` (`[ -d AutomationApp ] && ... || ...`) — hoặc chấp nhận mỗi lineage (release=AutomationAppLegacy, master=AutomationApp) giữ bản workflow riêng, nội bộ nhất quán.

---

## 10. Troubleshooting nhanh

| Triệu chứng | Nguyên nhân / fix |
|---|---|
| init `could not read Username` | git auth: dùng `x-access-token:$TOKEN` trong URL (không Bearer) |
| init `403 Write access not granted` / API 404 | token thiếu quyền repo; classic PAT + `repo` + SSO authorize |
| `scripts/docker-entrypoint.sh: No such file` | scripts chưa push lên branch được clone |
| `$'\r': command not found` | file CRLF → convert LF (+ `.gitattributes`) |
| `npm ci ... not in sync` | bình thường → fallback `npm install` |
| consumer `ETIMEDOUT ...<integration-msk>` | `TEST_ENV=qa` → integration MSK không reach từ dev; dùng `TEST_ENV=dev` |
| `curl: command not found` | image slim không có curl → upload bằng node fetch |
| pod `Killing` + `BackoffLimitExceeded` giữa test | node bị consolidate (Karpenter) → thêm `karpenter.sh/do-not-disrupt` |
| kubectl `Unauthorized` sau khi IAM OK | principal chưa trong EKS access entry → DevOps thêm access entry + RBAC |
| kubectl `Token has expired` | `aws sso login --profile qa` |
| Jira attach `HTTP 400 exceedes max size` | zip >100MB → loại `trace/`, size-guard, thu hẹp `test-pattern` |
| CI resolve ticket `av.wo` (bị cắt) | grep `[^\r\n]` literal → dùng grep nguyên dòng + sed |
