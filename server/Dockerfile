FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache make gcc g++ musl-dev linux-headers

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
