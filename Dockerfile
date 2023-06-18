FROM node

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN apt update && apt install -y node-typescript
RUN yarn install

COPY . .

RUN tsc

EXPOSE 3000

CMD ["node", "index.js"]
