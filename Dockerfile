FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install && npm install express -y

COPY . .

EXPOSE 3000

CMD ["node", "readFile.js"]
