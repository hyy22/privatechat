FROM node:16.18.1-slim
WORKDIR /app
COPY . .
RUN npm config set registry https://registry.npm.taobao.org && npm install && npm install pm2 -g
VOLUME [ "/app/upload", "/app/logs" ]
EXPOSE 9000
# ENTRYPOINT [ "pm2-runtime", "/app/src/server.js" ]