#!/bin/bash

# 梦幻西游挖图预测分析系统 - 启动脚本

if [ "${NODE_ENV:-development}" = "production" ]; then
    echo "🚀 生产模式启动后端服务..."
    npm run start
    exit $?
fi

DATA_ROOT="${APP_DATA_DIR:-data}"
DB_FILE="${DB_PATH:-$DATA_ROOT/database.sqlite}"

echo "🚀 正在检查项目依赖..."

# 检查依赖是否安装
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo "📦 正在安装依赖，请稍候..."
    npm run install-all
else
    echo "✅ 依赖已安装"
fi

if [ ! -f "$DB_FILE" ]; then
    echo "🗄️ 首次启动，正在初始化管理员账号..."
    npm run seed
else
    echo "🗄️ 已检测到本地数据库，跳过管理员初始化"
fi

echo "🔥 正在启动服务 (后端: 3000, 前端: 5173)..."
echo "提示: 按下 Ctrl+C 可停止所有服务"

npm run dev
