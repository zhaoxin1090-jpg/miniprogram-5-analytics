# 觉行Lab 训练营数据后台

自研 Web 管理后台，用于查看训练营完成率、学员完成情况、单个学员任务完成详情、学习行为明细和任务表现分析。

## 范围

- 只读调用 CloudBase 分析云函数。
- 不修改订单、权益、课程、打卡、奖学金、提现或 CMS 数据。
- 页面不展示 `openid`、`unionid` 或订单号。
- 学员列表展示现有小程序昵称和脱敏手机号；仅可在独立授权的单学员本期档案中导出完整手机号。
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
- 仅为此分析网页调用的函数允许已登录账号调用，不扩大其他函数的客户端调用范围。示例：

```json
{
  "analyticsCamps": {
    "invoke": "auth != null && auth.loginType != 'ANONYMOUS'"
  }
}
```

上述函数仅接受云端调用上下文里的真实 Web UID，需加入服务端 `ANALYTICS_ADMIN_IDS` / `ANALYTICS_ADMIN_USER_IDS`，旧 `ANALYTICS_ALLOW_WEB_AUTH` 不再放行。测试环境还应设置 `ANALYTICS_READ_CAMP_GRANTS`，只给测试账号分配指定虚构营期。仅具备读权限不等于可导出：名单、原文和报告另行按账号、营期及可选字段授予。

## 本期学员名单导出（本地待联调）

- 「学员完成情况」的「导出当前筛选」使用当前营期和排序，覆盖所有匹配学员，不限当前页。文件不含手机号、微信身份标识或任务原文。
- 后端先校验调用者的 CloudBase Web 身份，再检查仅服务端配置的营期授权映射。测试环境须为指定测试操作人设置 `ANALYTICS_ROSTER_EXPORT_GRANTS`（格式：`{"测试Web用户ID":["虚构营期ID"]}`）；未配置时保持关闭，不沿用普通的 Web 登录开关。
- 测试环境需准备客户端不可读写的 `analytics_export_audit` 集合。审计写入成功后才允许返回导出结果。页面不保存或缓存名单文件；超大结果明确失败，不下载截断文件。
- 上线前在隔离环境确认运行时上下文、分页查询、导出审计和最小角色分别可用；仅本地验证不能替代上述检查。回滚时先撤销导出授权，再还原本次分析函数和网页版本。无需上传小程序。

## 营期漏斗与待跟进（本地待联调）

- 看板按北京时间、营期配置及每日有效打卡结算；漏斗显示达成数、可观察人数和报名总数。结营达成指完成该期已开放配置的课程，不能用报名记录的结束状态替代。
- 风险默认关注最近 3/7 个配置学习日及距离奖学金门槛 3 天。可通过函数服务端的 ANALYTICS_RISK_BY_CAMP 按营期调整，例如 `{"fixture":{"inactive_days":[3,7],"scholarship_near_days":2}}`。未开营和已结营时不生成待跟进人群。
- 名单下钻沿用现有看板访问权限，只返回姓名显示、进度、最近有效打卡等查看字段，不包含手机号或任务原文。

## 任务分析与导出（本地待联调）

- 查看、成功及失败分别使用所选北京时间范围内的事件；已保存业务完成不参与提交率分子，无相应埋点显示不可得。
- 测试环境服务端按营期配置 `ANALYTICS_TASK_EXPORT_GRANTS`，示例 `{"测试Web用户ID":{"虚构营期ID":["metadata","writing","mindfulness"]}}`；未配置时不能导出或查看原文。学员任务导出要求 `metadata`，原文额外要求对应类型。本次不返回私密原文或手机号。
- 仅从 `analyticsTaskSubmissions` 审计成功后的授权结果生成文件；需先准备客户端不可读写的审计集合。追踪号在 Excel 的导出说明中。同步导出过大时明确提示，不能下载截断数据。

## 学员档案和跨学员行为（本地待联调）

- `analyticsArchives` 仅接受由服务端调用上下文提供的已授权 Web 身份。测试环境可按营期设置 `ANALYTICS_ARCHIVE_GRANTS`，例：`{"测试Web用户ID":{"虚构营期ID":["metadata","events"]}}`。
- 书写、正念、课程日记、课程测评、事件与联系方式均有独立范围（`writing`、`mindfulness`、`diary`、`assessment`、`events`、`contacts`）。完整手机号还要求 `contacts_full`，仅限显式选择单学员本期档案；敏感输出需指定用途。测试阶段不要授权真实敏感数据。
- 审计和每分钟导出限额都写入客户端不可读写的 `analytics_export_audit`；相关权限需在部署前确认。无明确课程关联的私人日记或独立测评不导出。跨营期不按昵称或号码合并账号。

## 导出中心与运营报告（本地待联调）

- 学员名单支持选中学员、全部筛选结果和本营期全部；可切换标准列与自选列。任务、档案、行为及运营报告也可排队。
- 导出中心显示排队、处理、完成、空结果、失败和过期；失败可重试，文件有效一小时。每次下载校验当前身份及营期、字段授权，不生成公开文件地址。
- 运营报告默认使用看板的营期、报名分组和日期；含生成时间、读取时间、有效来源更新时间及口径。缺失开始事件不以查看替代。
- 测试联调前准备 `analyticsExportJobs`、私有作业与文件集合、定时触发器，并仅为虚构营期配置测试授权。测试函数配置、权限隔离和定时运行不能由本地测试替代。

## 构建

```bash
npm run build
```

测试环境用 `npm run build:todo-demo`，仅上传独立产物 `dist-analytics-test/`，不要使用默认 `dist/` 或默认指向正式环境的 `cloudbaserc.json`。测试模式遇到空环境或其他环境直接拒绝构建。

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
