FROM node:19

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g yarn \
    && yarn install \
    && yarn add -g typescript \

COPY . .

RUN tsc

EXPOSE 3000

CMD ["node", "index.js"]
