# 觉行Lab 训练营数据后台

自研 Web 管理后台，用于查看训练营完成率、学员完成情况、单个学员任务完成详情、学习行为明细和任务表现分析。

## 范围

- 只读调用 CloudBase 分析云函数。
- 不修改订单、权益、课程、打卡、奖学金、提现或 CMS 数据。
- 页面不展示 `openid`、`unionid` 或订单号。
- 学员列表面向管理员展示小程序昵称和完整手机号，便于运营联系。
- 任务表现分析支持管理员查看书写 / 正念任务的提交内容汇总。

## 页面

- 营期完成率：调用 `analyticsCohortSummary`
- 学员完成情况：调用 `analyticsCohortUsers`
- 学员详情：调用 `analyticsCohortUserTasks` 和 `analyticsUserEvents`
- 任务表现分析：调用 `analyticsTaskAnalysis`
- 任务提交内容：调用 `analyticsTaskSubmissions`

## 当前入口

CloudBase Web App 默认域名：

```text
https://juexinglab-analytics-cloud1-d9grcmy66e93364b0.webapps.tcloudbase.com
```

CloudBase 静态托管入口：

```text
https://cloud1-d9grcmy66e93364b0-1438069091.tcloudbaseapp.com
```

当前静态托管入口已完成登录、数据加载和任务提交内容下钻验收，可作为现阶段运营后台入口。后续如需更正式的访问地址，再绑定自定义域名或切换其他 Web 托管入口。

## 本地开发

```bash
npm install
npm run dev
```

默认连接 CloudBase 环境：

```text
cloud1-d9grcmy66e93364b0
```

如需覆盖配置，复制 `.env.example` 为 `.env` 后修改：

```text
VITE_TCB_ENV_ID=cloud1-d9grcmy66e93364b0
VITE_TCB_REGION=ap-shanghai
```

## 登录与权限

后台使用 CloudBase Web Auth 的账号密码登录，不再使用匿名登录。

上线前需要在 CloudBase 控制台确认：

- 身份认证已开启“账号密码登录”。
- 已创建可用于运营登录的账号。
- 云函数客户端调用权限建议设为：

```json
{
  "*": {
    "invoke": "auth != null && auth.loginType != 'ANONYMOUS'"
  }
}
```

分析云函数内部仍需开启 Web Auth 访问开关，例如 `ANALYTICS_ALLOW_WEB_AUTH=true`。该模式表示所有已登录的 Web 账号都可访问数据后台，不再逐个配置管理员 Web 用户 ID。

## 构建

```bash
npm run build
```

部署前必须先确认：

- 分析云函数已部署。
- `analyticsTaskSubmissions` 已部署且权限配置和其他分析函数一致。
- Web Auth 可登录。
- 分析函数管理员权限配置正确。
- 不在未验收状态下发布到公开入口。

## 验收状态

2026-07-28 已完成线上验收：

- 营期完成率可加载。
- 学员完成情况可加载。
- 学员详情中的任务完成详情和学习行为可加载。
- 任务表现分析可加载。
- 书写 / 正念任务可打开提交内容汇总。
