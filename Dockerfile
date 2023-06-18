FROM node

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN apt install node-typescript
RUN yarn install

COPY . .

RUN tsc

EXPOSE 3000

CMD ["node", "index.js"]
