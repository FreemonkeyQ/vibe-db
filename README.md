# Vibe DB - 数据库 Schema 可视化设计工具

一个基于 Next.js 的数据库表结构可视化管理和编辑工具，支持拖拽式设计、DBML 导出和实时预览。

## ✨ 功能特性

- 🎨 **可视化设计** - 拖拽式画布界面，直观设计数据库表结构
- 📊 **表结构管理** - 支持创建、编辑和管理数据表、字段、索引
- 🔗 **关系连线** - 可视化建立表间关系（一对一、一对多、多对多）
- 📝 **DBML 导出** - 支持导出为 DBML 格式，方便文档化和分享
- 🎯 **实时预览** - 修改即时反映在画布上
- 🎨 **颜色标记** - 为不同表设置颜色，便于分类管理
- 📋 **排序管理** - 支持表和字段的拖拽排序

## 🛠️ 技术栈

### 前端

- **Next.js 16** - React 全栈框架
- **React 19** - UI 库
- **@xyflow/react** - 流程图/画布渲染引擎
- **@dnd-kit** - 拖拽交互库
- **Mantine UI** - 现代化 UI 组件库
- **Tailwind CSS 4** - 原子化 CSS 框架
- **CodeMirror** - 代码编辑器（DBML 编辑）

### 后端 & 数据库

- **Prisma ORM** - 类型安全的数据库工具
- **PostgreSQL** - 关系型数据库
- **Zod** - 数据验证库

### 其他工具

- **@dbml/core** - DBML 解析和渲染
- **Pino** - 高性能日志库
- **Sonner** - 通知提示组件

## 📦 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 数据库
- pnpm 或 npm

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd vibe-db
```

2. **安装依赖**

```bash
pnpm install
# 或
npm install
```

3. **配置环境变量**

```bash
cp .env.example .env.dev
```

编辑 `.env.dev` 文件，配置数据库连接：

```env
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/vibe_db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **初始化数据库**

```bash
# 生成 Prisma 客户端
npm run db:generate

# 执行数据库迁移
npm run db:migrate
```

5. **启动开发服务器**

```bash
npm run dev
```

访问 http://localhost:3000 开始使用。

## 📖 可用脚本

```bash
# 开发环境
npm run dev              # 启动开发服务器
npm run db:generate      # 生成 Prisma 客户端
npm run db:push          # 推送 schema 到数据库（无迁移文件）
npm run db:studio        # 打开 Prisma Studio 数据管理界面
npm run db:migrate       # 执行开发环境数据库迁移

# 生产环境
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
npm run db:migrate:prod  # 执行生产环境数据库迁移

# 代码质量
npm run lint             # 运行 ESLint 检查
```

## 🗂️ 项目结构

```
vibe-db/
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   └── migrations/            # 数据库迁移文件
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── field/         # 字段相关接口
│   │   │   ├── index/         # 索引相关接口
│   │   │   ├── relation/      # 关系相关接口
│   │   │   ├── schemas/       # Schema 相关接口
│   │   │   └── table/         # 表相关接口
│   │   └── workspace/         # 工作区页面
│   ├── components/            # 通用组件
│   ├── features/              # 业务功能模块
│   │   ├── canvas/            # 画布相关（节点、连线）
│   │   └── schema/            # Schema 管理面板
│   ├── hooks/                 # 自定义 React Hooks
│   ├── lib/                   # 工具库
│   └── server/                # 服务端逻辑
│       ├── mappers/           # 数据映射器
│       ├── schemas/           # Zod 验证 schema
│       └── services/          # 业务服务层
├── public/                    # 静态资源
└── logs/                      # 应用日志
```

## 💾 数据库模型

项目使用 Prisma 管理以下核心数据模型：

- **Schema** - 数据库设计方案（项目）
- **Table** - 数据表（画布上的节点）
- **Field** - 表字段（列定义）
- **Index** - 数据库索引
- **Relation** - 表间关系（画布上的连线）

详细模型定义请查看 [prisma/schema.prisma](prisma/schema.prisma)

## 🔌 API 接口

项目提供完整的 RESTful API：

- `GET/POST /api/schemas` - Schema 列表和创建
- `GET/POST/PUT/DELETE /api/table` - 表的增删改查
- `GET/POST/PUT/DELETE /api/field` - 字段的增删改查
- `GET/POST/PUT/DELETE /api/index` - 索引的增删改查
- `GET/POST/PUT/DELETE /api/relation` - 关系的增删改查
- `POST /api/*/reorder` - 排序接口

## 🎯 开发指南

### 添加新的 API 接口

按照项目规范，在接口方法上方添加路由注释：

```javascript
// POST /api/your-new-endpoint
export async function POST(request) {
  // 实现逻辑
}
```

### 数据库模型变更

1. 编辑 `prisma/schema.prisma`
2. 运行 `npm run db:migrate` 生成并应用迁移
3. 运行 `npm run db:generate` 更新类型定义

## 📝 环境变量

| 变量名                | 说明             | 示例                                  |
| --------------------- | ---------------- | ------------------------------------- |
| `NODE_ENV`            | 运行环境         | `development` / `production`          |
| `DATABASE_URL`        | 数据库连接字符串 | `postgresql://user:pass@host:5432/db` |
| `NEXT_PUBLIC_APP_URL` | 应用访问地址     | `http://localhost:3000`               |

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

Private - All rights reserved

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [React Flow](https://reactflow.dev/)
- [Mantine](https://mantine.dev/)
- [DBML](https://www.dbml.org/)
