# CI/CD with Jenkins - Knowledge Base

## General

### What is CI/CD for Automation Testing?

CI/CD (Continuous Integration / Continuous Delivery) for automation testing means tests are triggered automatically through a pipeline instead of being run manually on a developer's machine. Jenkins acts as the orchestrator — it watches for triggers, pulls code, and executes tests in a controlled environment.

### Flow

```
Tester triggers job on Jenkins
        ↓
Jenkins pulls latest code from GitHub
        ↓
Jenkins reads Jenkinsfile (pipeline definition)
        ↓
Jenkins spins up Docker container (Playwright image)
        ↓
Tests run inside container against target environment
        ↓
Results published as HTML report in Jenkins UI
        ↓
Container cleaned up
```

### Promotion Flow (QA → Staging)

Tests are not automatically promoted. The tester manually controls the flow:

1. Trigger job → select **QA** environment → tests pass
2. Trigger job again → select **Staging** environment → tests pass
3. Only then is the build considered ready for production

This is a **manual promotion flow** — simple and appropriate for teams starting out with CI/CD.

### Key Files (2 layers)

| Layer | File | Role |
|---|---|---|
| **Jenkins server** | `docker_ci_cd/Dockerfile` | Custom Jenkins image + Docker CLI + Compose plugin |
| **Jenkins server** | `docker_ci_cd/docker-compose.yaml` | Run Jenkins container, persist data, mount Docker socket |
| **Test repo (root)** | `Jenkinsfile` | Pipeline definition — stages, parameters, post actions |
| **Test repo (root)** | `docker-compose.yml` | Spin up Playwright container, pass env vars, run tests |
| **Test repo (root)** | `playwright.config.ts` | Reads `BASE_URL` from env; browser selected via CLI `--project` |
| **Test repo (root)** | `package.json` + `package-lock.json` | Dependencies; `npm ci` in container requires lock file |
| **Test repo (root)** | `.dockerignore` | Exclude `node_modules`, reports from Docker context (if build) |

---

## Jenkinsfile — giải thích từng block (file: `Jenkinsfile`)

```
pipeline { ... }          ← Khai báo Declarative Pipeline
agent any                 ← Chạy trên bất kỳ Jenkins agent nào (có Docker CLI)
parameters { ... }        ← Build with Parameters: ENVIRONMENT, BROWSER
environment { ... }       ← Map param → BASE_URL, BROWSER env vars
options { ... }           ← Timeout 30 phút, giữ 20 build log, timestamps
stages { ... }            ← Các bước chính
post { ... }              ← Luôn chạy cleanup sau toàn pipeline
```

### Stage 1: `Checkout`

```groovy
checkout scm
```

- Jenkins clone/pull **Git repo** (repo chứa `Jenkinsfile` này) vào workspace.
- Job phải cấu hình **Pipeline from SCM** trỏ đúng branch + path `Jenkinsfile`.

### Stage 2: `Run Tests`

```groovy
sh 'docker compose up --abort-on-container-exit --exit-code-from playwright-tests'
```

| Flag | Ý nghĩa |
|---|---|
| `docker compose up` | Đọc `docker-compose.yml` ở workspace root |
| `--abort-on-container-exit` | Container test xong → dừng các service còn lại |
| `--exit-code-from playwright-tests` | Exit code của pipeline = exit code test container (pass/fail) |

**Post (always)** trong stage này:

- `publishHTML` → hiển thị `playwright-report/index.html` trên Jenkins UI (cần plugin **HTML Publisher**).
- `archiveArtifacts` → lưu report + `test-results/` (screenshot, trace, video on failure).

### Post pipeline (always)

```groovy
sh 'docker compose down --volumes'
```

- Dọn container + anonymous volumes sau mỗi build (tránh rác Docker trên agent).

---

## Jenkins Job — cấu hình cần thiết (1 lần trên UI)

1. **New Item** → **Pipeline**
2. **Pipeline** → Definition: **Pipeline script from SCM**
3. **SCM**: Git → URL repo → credentials → branch (`main` / `master`)
4. **Script Path**: `Jenkinsfile`
5. **Bỏ chọn** *Lightweight checkout* (tránh lỗi `not in a git directory`)
6. Cài plugin: **HTML Publisher**, **Pipeline**, **Git**
7. Build lần 1 (default params) → từ build 2 dùng **Build with Parameters**

---

## Luồng end-to-end (dùng file trong repo này)

```
[1] docker_ci_cd/
    docker compose up -d --build     → Jenkins server chạy :8080

[2] Jenkins UI → tạo Pipeline job → trỏ Git repo test

[3] Build with Parameters
    ENVIRONMENT=QA, BROWSER=chromium

[4] Jenkinsfile:
    Checkout → set BASE_URL → docker compose up (test repo)

[5] docker-compose.yml:
    playwright-tests container → npm ci → npx playwright test

[6] playwright-report/ → publishHTML + archiveArtifacts

[7] post: docker compose down --volumes
```

### How Parameters Work

```groovy
parameters {
    choice(name: 'ENVIRONMENT', choices: ['QA', 'Staging'])
    choice(name: 'BROWSER', choices: ['chromium', 'firefox', 'webkit'])
}
```

- First build: runs automatically with default values (no prompt)
- From build 2 onward: Jenkins shows "Build with Parameters" dialog

### How ENV Vars Flow from Jenkins → Docker → Playwright

```
Jenkinsfile (environment block)
    BASE_URL = QA ? 'https://...' : 'https://...'
        ↓
Jenkins exports to shell environment
        ↓
docker-compose.yml picks up via ${BASE_URL:-default}
        ↓
Container receives BASE_URL as environment variable
        ↓
playwright.config.ts reads process.env.BASE_URL
```

### Docker Socket Mount (local only)

Jenkins runs inside a Docker container but needs to run `docker compose` to spin up Playwright. The solution is to mount the host's Docker socket into the Jenkins container:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

This lets Jenkins talk to the host Docker daemon — containers Jenkins spawns appear on the host, not nested inside Jenkins container. This is a **local-only workaround**. On a real VM, Jenkins is installed directly on the OS and Docker CLI is available natively.

---

## Errors Encountered

### 1. `fatal: not in a git directory` (Lightweight Checkout)

**When**: First attempt to run pipeline after creating job.

**Cause**: Jenkins uses "Lightweight checkout" by default — tries to read the Jenkinsfile without fully cloning the repo first. In a fresh workspace with no git repo initialized, this fails.

**Fix**: Uncheck **Lightweight checkout** in job configuration → Pipeline section.

---

### 2. `fatal: detected dubious ownership in repository`

**When**: After disabling Lightweight checkout, on Windows with Jenkins in Docker.

**Cause**: Git 2.35+ security feature rejects running in directories owned by a different user. On Windows, files mounted into Docker containers via WSL2 report mismatched ownership.

**Fix**: Set `safe.directory = *` via Git environment variables in `docker-compose.yml`:

```yaml
environment:
  - GIT_CONFIG_COUNT=1
  - GIT_CONFIG_KEY_0=safe.directory
  - GIT_CONFIG_VALUE_0=*
```

This is persistent across container restarts. Running `git config --global` inside the container is lost on restart.

**Note**: This issue only occurs on local Windows + Docker setup. On a Linux VM, ownership is consistent and this error never appears.

---

### 3. `docker: not found`

**When**: Pipeline reached the `docker compose up` step.

**Cause**: The official `jenkins/jenkins:lts-jdk21` image does not include Docker CLI. Jenkins container cannot run `docker compose` without it.

**Fix**: Create a custom Dockerfile that installs Docker CLI on top of the Jenkins base image:

```dockerfile
FROM jenkins/jenkins:lts-jdk21

USER root

RUN apt-get update && \
    apt-get install -y docker.io curl && \
    mkdir -p /usr/local/lib/docker/cli-plugins && \
    curl -SL "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" \
         -o /usr/local/lib/docker/cli-plugins/docker-compose && \
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose && \
    rm -rf /var/lib/apt/lists/*

USER jenkins
```

Update `docker-compose.yml` to use `build: .` instead of `image: jenkins/jenkins:lts-jdk21`.

Build with: `docker compose up -d --build` (only needed when Dockerfile changes).

**Note**: On a real Jenkins VM, Docker CLI is installed directly on the OS — no Dockerfile needed.

---

### 4. `E: Unable to locate package docker-compose-plugin`

**When**: Building the custom Dockerfile.

**Cause**: `docker-compose-plugin` is published by Docker Inc in their own apt repository, not in Debian's default repos. The Jenkins base image uses Debian trixie which does not include this package.

**Fix**: Download the Docker Compose v2 binary directly from GitHub releases instead of using apt:

```dockerfile
curl -SL "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" \
     -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

**Why the binary approach**: `docker compose` (space, v2) runs as a Docker CLI plugin. The binary must be placed in `/usr/local/lib/docker/cli-plugins/`. The Jenkinsfile uses `docker compose` syntax (v2), so v1 `docker-compose` (hyphen) is not a valid substitute without changing the Jenkinsfile.

---

### 5. `No such DSL method 'publishHTML'`

**When**: Post stage tried to publish the Playwright HTML report.

**Cause**: `publishHTML(...)` is provided by the **HTML Publisher** plugin, which is not installed by default in Jenkins.

**Fix**: Manage Jenkins → Plugins → Available plugins → search **HTML Publisher** → Install → Restart Jenkins.

---

### 6. Invalid username or password after container restart

**When**: After `docker compose down && docker compose up -d` to apply new config.

**Cause**: Previously, Jenkins data (users, jobs, config) was stored inside the container's internal filesystem — not in the bind-mounted volume. When `docker compose down` removed the container, all data was lost. The new container started as a fresh Jenkins instance.

**Fix (recovery)**: Temporarily disable security by editing `config.xml` on the host:

```bash
sed -i 's/<useSecurity>true<\/useSecurity>/<useSecurity>false<\/useSecurity>/' \
  ./volumes/master/config.xml
docker restart docker_ci_cd-jenkins-1
# Then go to Jenkins UI → Manage Jenkins → Security → re-enable and set new password
```

**Prevention**: Ensure `./volumes/master:/var/jenkins_home` is mounted before the first Jenkins setup. All data written after that point is persisted on the host and survives container recreation.

---

## Setup review (repo hiện tại)

### Đúng / đã có

| Item | Status |
|---|---|
| `Jenkinsfile` declarative pipeline với parameters | OK |
| Env flow: Jenkins → `BASE_URL`/`BROWSER` → docker-compose → Playwright | OK |
| Playwright official image `v1.59.1-jammy` khớp `@playwright/test` | OK |
| `npm ci` + `package-lock.json` | OK |
| Report publish + archive artifacts | OK |
| Jenkins Dockerfile cài Docker CLI + Compose v2 plugin | OK |
| Git `safe.directory` trong Jenkins compose | OK |
| `.dockerignore` loại trừ report/node_modules | OK |

### Đã sửa

| Item | Fix |
|---|---|
| `docker_ci_cd/docker-compose.yaml` volume | Đổi thành `./volumes/master:/var/jenkins_home` (persist Jenkins data trên host) |

### Cần lưu ý / có thể bổ sung sau

| Item | Ghi chú |
|---|---|
| `tests/auth/auth.setup.ts` đang comment hết | E2E projects phụ thuộc `setup` + `storageState` — CI có thể fail hoặc chạy như guest; cần bật lại setup + Jenkins credentials `UNIQLO_USER`/`UNIQLO_PASS` |
| `tests/auth/.auth/user.json` = `{}` | Storage state rỗng cho đến khi auth setup chạy thành công |
| `user: root` trong Jenkins compose | Chạy được với docker.sock; production nên dùng group `docker` + user `jenkins` |
| Plugin **HTML Publisher** | Phải cài thủ công trên Jenkins UI |
| `BROWSER=all` | Chạy mọi project kể cả `api` — nếu chỉ muốn UI: đổi command thành `--project=chromium --project=firefox --project=webkit` |
| Secrets | Thêm Jenkins Credentials cho login/env nhạy cảm thay vì hardcode trong Jenkinsfile |
