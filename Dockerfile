# Uses node 24 alpine image as the base image
FROM node:24-alpine

#Goes to the app directory
WORKDIR /app 

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

#Install app dependencies
RUN npm install
RUN npm install kaplay

# Copy the rest of the app into the container
COPY . . 

# Set port environment variable
ENV PORT=5173
# Expose the port so our computer can run it
EXPOSE 5173

# Run the app
CMD ["npm", "run", "dev"]