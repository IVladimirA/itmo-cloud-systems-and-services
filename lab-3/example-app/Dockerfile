FROM node:21.1-alpine3.17

WORKDIR /home/example-app

ARG PASSWORD
ENV PASSWORD=$PASSWORD

COPY . .
RUN npm i

EXPOSE 3000

ENTRYPOINT ["node", "src/index.js"]
