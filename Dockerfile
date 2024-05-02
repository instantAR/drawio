FROM node:18-alpine as build

WORKDIR /app
COPY ./src/main/webpack/package.json ./package.json
RUN npm install
COPY ./ /app
RUN cd /app/src/main/webpack && npm run build


# FROM nginx:1.21-alpine

# COPY --from=build /app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]