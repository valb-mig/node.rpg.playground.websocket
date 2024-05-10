FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm install

# RUN npm install --save-dev nodemon

COPY . .

EXPOSE 4000

CMD ["npx", "nodemon", "server.js"]