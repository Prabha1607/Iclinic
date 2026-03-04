FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt || true

# Copy pyproject.toml and install all dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir \
    "argon2-cffi>=25.1.0" \
    "asyncpg>=0.31.0" \
    "fastapi>=0.133.1" \
    "langchain-groq>=1.1.2" \
    "langgraph>=1.0.9" \
    "passlib[bcrypt]>=1.7.4" \
    "psycopg[binary]>=3.3.3" \
    "pydantic-settings>=2.13.1" \
    "pydantic[email]>=2.12.5" \
    "python-dotenv>=1.2.1" \
    "python-jose[cryptography]>=3.5.0" \
    "python-json-logger>=4.0.0" \
    "python-multipart>=0.0.22" \
    "sentence-transformers>=5.2.3" \
    "sqlalchemy>=2.0.47" \
    "twilio>=9.10.2" \
    "uvicorn>=0.41.0" \
    "websockets>=16.0"

# Copy application source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.api.rest.app:app", "--host", "0.0.0.0", "--port", "8000"]