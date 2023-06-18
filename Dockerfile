FROM node:19

WORKDIR /app

COPY package*.json ./

RUN apt install node-typescript \
    && yarn install

COPY . .

RUN tsc

EXPOSE 3000

CMD ["node", "index.js"]
