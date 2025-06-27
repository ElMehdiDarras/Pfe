FROM node:18-alpine as build

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies directly
RUN apk add --no-cache --virtual .gyp python3 make g++ \
    && npm install \
    && apk del .gyp

COPY . .

RUN npm run build

# Use a simpler server approach
FROM node:18-alpine 

RUN npm install -g serve

WORKDIR /app

COPY --from=build /usr/src/app/build .

EXPOSE 2000

CMD ["serve", "-s", ".", "-l", "4000"]