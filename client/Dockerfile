FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY client/ ./client/

RUN npm install --workspace=codesync-client
RUN npm run build --workspace=codesync-client

FROM nginx:alpine

COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
