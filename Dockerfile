FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install 

COPY . .

# Build the React app
RUN npm run build

# Expose the port that the app will run on
EXPOSE 4173

# Set the command to run the app
CMD ["npm", "run", "preview"]