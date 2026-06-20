# 「码途」EdgeOne Pages 部署方案

> **目标**：零费用、国内直连、全功能上线。
> **仓库**：https://github.com/cqk123/code_journey.git
> **原理**：EdgeOne Pages = 腾讯云的 Vercel，原生支持 Next.js 15 SSR + API Routes。

---

## 前置：代码已适配完成

| 改了什么 | 状态 |
|---------|:--:|
| `lib/blob.ts` 三模式：COS / Vercel Blob / 本地 | ✅ |
| `lib/db.ts` 双模式：Turso / 本地 SQLite | ✅ |
| `cos-nodejs-sdk-v5` 已安装 | ✅ |
| API Routes（cron）端点保留，外部调度 | ✅ |

---

## 第 1 步：准备 COS 对象存储（5 分钟）

> 腾讯云对象存储 COS 免费额度：50GB 存储 + 10GB 外网流量/月，远超需求。

1. 打开 [https://console.cloud.tencent.com/cos](https://console.cloud.tencent.com/cos)
2. 点击「创建存储桶」
3. 填写：
   - **名称**：`codejourney` 或任意名
   - **所属地域**：选离你最近的（如 `广州 ap-guangzhou`）
   - **访问权限**：☑ **公有读私有写**
4. 点「创建」
5. 进入存储桶 → **权限管理** → **跨域访问 CORS 设置** → 添加规则：
   - 来源 Origin：`*`
   - 操作 Methods：`GET PUT POST DELETE HEAD`
   - Allow-Headers：`*`
6. 获取密钥：[https://console.cloud.tencent.com/cam/capi](https://console.cloud.tencent.com/cam/capi)
   - 记下 **SecretId** 和 **SecretKey**

---

## 第 2 步：注册 EdgeOne Pages（3 分钟）

1. 打开 [https://edgeone.ai](https://edgeone.ai) → 点击右上角「登录」
2. 用微信/邮箱注册 → 进入控制台
3. 左侧菜单 → **Pages** → **创建项目**
4. 选择 **从 Git 仓库导入** → 授权 GitHub → 选 `cqk123/code_journey`
5. 框架自动识别为 **Next.js**

---

## 第 3 步：配置环境变量

在项目设置 → **环境变量** 中填入：

| Name | Value | 说明 |
|------|-------|------|
| `DATABASE_URL` | `libsql://codejourney-cqk123.aws-ap-northeast-1.turso.io` | Turso URL |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODE5NDA1NTUsImlkIjoiMDE5ZWUzZWUtODcwMS03ZTc1LTliNDItZjMxODEwZGM0NTA2IiwicmlkIjoiMjdkMmIyMjEtMDNhMC00NTU2LWEyYzctMzhiNDE3ZGYxZDU3In0.mIM5pxYkvqrkZyIs4z9HVdKrb5EpsAQXI8SaxuXy2oT2hOSO1Y6TwC3kErCO51LifpXphQIV0b6izMFx7exvAg` | Turso Token |
| `COS_SECRET_ID` | 腾讯云的 SecretId | COS 密钥 |
| `COS_SECRET_KEY` | 腾讯云的 SecretKey | COS 密钥 |
| `COS_BUCKET` | 你的存储桶名称 | 如 `codejourney-1234567890` |
| `COS_REGION` | `ap-guangzhou` | 你选的区域 |
| `JWT_SECRET` | `POWFUA0SNEvJ5gajDiHp1XwTxBQZLeo9YIVKMrynk4d8hbGucq3Rt2zf7lms6C` | JWT 密钥 |
| `CRON_SECRET` | `T3mwZyH2cqPjGxi6M40klL8NQB9vzVJC` | Cron 密钥 |
| `NEXT_PUBLIC_BASE_URL` | 先填 `http://localhost:3000` | 部署后改域名 |

> SMTP 邮件变量可选，不填则验证码直接显示在页面上。

---

## 第 4 步：部署

点击「部署」→ 等待 3~5 分钟。

构建时 `postinstall` 脚本会自动运行 `prisma generate && prisma db push`，把你 Turso 上的 7 张表建好。

---

## 第 5 步：部署后操作

### 5.1 更新 BASE_URL

部署成功后你会得到一个域名（如 `codejourney-xxx.edgeone.app`），**不用改**——EdgeOne Pages 的 Next.js 会自动识别域名。

把 `NEXT_PUBLIC_BASE_URL` 更新为 `https://codejourney-xxx.edgeone.app`，然后重新部署。

### 5.2 灌入种子数据

```powershell
Invoke-RestMethod -Uri "https://你的域名.edgeone.app/api/cron/crawl" -Headers @{Authorization="Bearer T3mwZyH2cqPjGxi6M40klL8NQB9vzVJC"}
```

页面会显示「matched: N 条」。

### 5.3 洗数据（一键匹配）

```powershell
Invoke-RestMethod -Uri "https://你的域名.edgeone.app/api/cron/match" -Headers @{Authorization="Bearer T3mwZyH2cqPjGxi6M40klL8NQB9vzVJC"}
```

---

## 第 6 步：定时任务（cron-job.org 免费外部调度）

EdgeOne Pages 本身不带 Cron，用免费的 [cron-job.org](https://cron-job.org) 替代：

1. 打开 [https://cron-job.org](https://cron-job.org) → 注册
2. 创建 **3 个 Cron Job**：

| Name | URL | 执行频率 |
|------|-----|---------|
| `crawl` | `https://你的域名.edgeone.app/api/cron/crawl` | 每 60 分钟 |
| `match` | `https://你的域名.edgeone.app/api/cron/match` | 每天 2:00 |
| `mail` | `https://你的域名.edgeone.app/api/cron/mail` | 每天 9:00 |

3. 每个 job 设置 HTTP Header：
   - **Header Name**：`Authorization`
   - **Header Value**：`Bearer T3mwZyH2cqPjGxi6M40klL8NQB9vzVJC`

> cron-job.org 免费版支持最多 5 个 Job，足够用。

---

## 费用：¥0

| 服务 | 免费额度 | 够用吗 |
|------|------|:--:|
| EdgeOne Pages | 每月 10W 请求（Hobby）+ 构建分钟 | ✅ |
| Turso | 500 个数据库，9GB 存储，10 亿行读取/月 | ✅ |
| 腾讯云 COS | 50GB 存储，10GB 外网流量/月 | ✅ |
| cron-job.org | 5 个 Job，每分钟执行 | ✅ |

---

## 与 Vercel 方案的区别

| | Vercel | EdgeOne Pages |
|------|:--:|:--:|
| 国内访问 | ❌ 被墙 | ✅ 腾讯 CDN 直连 |
| 可打开管理面板 | ❌ 同样被墙 | ✅ 国内可访问 |
| 成本 | 免费 | 免费 |
| 文件存储 | Vercel Blob | 腾讯云 COS |
| 定时任务 | Vercel Cron | cron-job.org |
| 部署方式 | 同：Git Push | 同：Git Push |

---

## 部署检查清单

```
  □ COS 存储桶已创建（公有读）
  □ COS CORS 跨域已配
  □ 获取了 SecretId + SecretKey
  □ EdgeOne Pages 已导入仓库
  □ 环境变量全部填入（9 个）
  □ 部署成功、域名能打开
  □ 调用 /api/cron/crawl 灌种子数据
  □ 调用 /api/cron/match 触发全量匹配
  □ 注册 cron-job.org → 配 3 条定时任务
  □ 更新 NEXT_PUBLIC_BASE_URL → 重新部署
```

---

> **一句话**：GitHub 推代码 → EdgeOne Pages 自动部署 → 腾讯 CDN 全球加速，国内毫秒级打开，全免费。
