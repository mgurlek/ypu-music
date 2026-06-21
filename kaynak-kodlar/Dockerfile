# Use a base image that has both Node.js and Python
FROM nikolaik/python-nodejs:python3.11-nodejs20

# Install ffmpeg which is required by spotdl
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install node dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Install spotdl
RUN pip install spotdl

# Copy the rest of the Next.js app
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Create a volume directory for downloads inside the container
RUN mkdir -p /app/downloads

# Set the download directory environment variable for the API
ENV DOWNLOAD_DIR=/app/downloads

# Start the Next.js server
CMD ["npm", "run", "start"]
