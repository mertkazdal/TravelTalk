# Use official lightweight Python image
FROM python:3.12-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies for edge-tts (if any)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create audio directory with correct permissions
RUN mkdir -p temp_audio && chmod 777 temp_audio

# Expose the app port
EXPOSE 8000

# Start the application
CMD ["python", "main.py"]
