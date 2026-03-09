#!/bin/bash

# 梦幻西游挖图预测分析系统 - 启动脚本

echo "🚀 正在检查项目依赖..."

# 检查依赖是否安装
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo "📦 正在安装依赖，请稍候..."
    npm run install-all
else
    echo "✅ 依赖已安装"
fi

echo "🗄️ 确认数据库初始化..."
npm run seed

echo "🔥 正在启动服务 (后端: 3000, 前端: 5173)..."
echo "提示: 按下 Ctrl+C 可停止所有服务"

npm run dev
