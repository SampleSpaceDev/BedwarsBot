FROM node:19

WORKDIR /app

COPY package*.json ./

RUN yarn install \
    && yarn add -g typescript \

COPY . .

RUN tsc

EXPOSE 3000

CMD ["node", "index.js"]
