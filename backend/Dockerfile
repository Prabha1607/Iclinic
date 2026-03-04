FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy dependency files
COPY pyproject.toml .

# Install project dependencies
RUN pip install --no-cache-dir .

# Copy application source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.api.rest.app:app", "--host", "0.0.0.0", "--port", "8000"]