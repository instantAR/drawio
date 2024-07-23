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

COPY --from=build /app/src/main/webpack/dist /usr/share/nginx/html
COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]