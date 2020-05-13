FROM node:12-alpine3.11

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "./dist/bin/www.js"]