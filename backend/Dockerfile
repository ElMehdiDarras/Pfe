FROM node:18-alpine

WORKDIR /usr/src/app

# Pre-copy package.json to leverage Docker caching 
COPY package*.json ./

# Install dependencies directly rather than through npm
RUN apk add --no-cache --virtual .gyp python3 make g++ \
    && npm install \
    && apk del .gyp

COPY . .

EXPOSE 2001

CMD ["node", "app.js"]