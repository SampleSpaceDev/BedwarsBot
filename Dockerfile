FROM node:19

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN apt install -y cargo
RUN yarn install

COPY . .

RUN tsc

EXPOSE 3000

CMD ["node", "index.js"]
