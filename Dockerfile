# 使用 Node.js 20 LTS
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，因为需要编译）
RUN npm ci

# 复制源码
COPY . .

# 构建生产版本
RUN npm run build

# 安装 serve 用于生产环境
RUN npm install -g serve

# Railway 会注入 PORT 环境变量
ENV PORT=8080

# 暴露端口
EXPOSE $PORT

# 启动命令 - 监听 0.0.0.0 让 Railway 可以访问
CMD serve dist -s -l "0.0.0.0:$PORT"
