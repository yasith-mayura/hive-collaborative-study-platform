#!/bin/sh

# Wait for DB to be ready
echo "Waiting for PostgreSQL..."
while ! pg_isready -h $PGVECTOR_HOST -p $PGVECTOR_PORT -U $PGVECTOR_USER; do
  sleep 1
done


echo "PostgreSQL is ready."

# echo "Running migrations..."
# python manage.py migrate --noinput || { echo "Migrations failed"; exit 1; }

# Start the FastAPI app using Uvicorn
echo "Starting FastAPI app with Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload