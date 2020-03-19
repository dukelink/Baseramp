FROM node

WORKDIR //Users/dukel/Documents/Projects/goals-react-ts/server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "./dist/bin/www.js"]