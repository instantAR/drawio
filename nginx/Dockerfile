FROM nginx:1.21-alpine

RUN rm /etc/nginx/conf.d/default.conf
RUN mkdir -p /usr/src/app/media
COPY nginx.conf /etc/nginx/conf.d