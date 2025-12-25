# ---------- Build Stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# 复制依赖描述文件
COPY package*.json pnpm-lock.yaml ./

# 安装 pnpm 并安装依赖
RUN npm install -g pnpm
RUN pnpm install

# 复制源代码并构建
COPY . .
RUN pnpm build

# ---------- Production Stage ----------
FROM nginx:stable-alpine
WORKDIR /app

# 拷贝构建好的静态文件
COPY --from=build /app/dist /usr/share/nginx/html

# 拷贝 nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 开放端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
