FROM node:18-alpine as build

WORKDIR /app
COPY ./src/main/webpack/package.json ./package.json
RUN npm install
RUN npm install -g tsc \
    && npm install -g concurrently \
    && npm install -g typescript --force
COPY ./ /app
RUN cd /app/src/main/webpack && npm run build


FROM nginx:1.21-alpine

COPY ./docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=build /app/src/main/webpack/dist /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
EXPOSE 80