# 觉行Lab 训练营数据后台

自研 Web 管理后台，用于查看训练营完成率、学员完成情况、单个学员任务完成详情、学习行为明细和任务表现分析。

## 范围

- 只读调用 CloudBase 分析云函数。
- 不修改订单、权益、课程、打卡、奖学金、提现或 CMS 数据。
- 页面不展示 `openid`、`unionid`、订单号、书写正文或正念感想正文。
- 学员列表面向管理员展示小程序昵称和完整手机号，便于运营联系。

## 页面

- 营期完成率：调用 `analyticsCohortSummary`
- 学员完成情况：调用 `analyticsCohortUsers`
- 学员详情：调用 `analyticsCohortUserTasks` 和 `analyticsUserEvents`
- 任务表现分析：调用 `analyticsTaskAnalysis`

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

## 构建

```bash
npm run build
```

部署前必须先确认：

- 分析云函数已部署。
- Web Auth 可登录。
- 分析函数管理员权限配置正确。
- 不在未验收状态下发布到公开入口。
