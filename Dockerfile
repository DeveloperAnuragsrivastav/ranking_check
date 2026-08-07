FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY . ./
WORKDIR /app/backend
CMD ["npm", "start"]
