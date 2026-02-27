#!/bin/bash

# Local registry config
REGISTRY=localhost:5000
REGISTRY_CONTAINER_NAME=local-registry

# List of images
IMAGES=(
  "nginx-custom:alpine ./nginx"
)

# Step 0: Cleanup using Docker built-in command
echo "--------------------------------------"
echo "Stopping all runninng containers..."
docker stop $(docker ps -q)
echo "Cleaning up unused images, containers, and cache..."
docker system prune -a -f
docker volume prune -a -f

echo "Cleanup complete."
echo "--------------------------------------"

# Step 1: Ensure local registry is running
echo "Checking if local registry is running..."
if ! docker ps | grep -q "$REGISTRY_CONTAINER_NAME"; then
  if docker ps -a | grep -q "$REGISTRY_CONTAINER_NAME"; then
    echo "Starting existing registry container..."
    docker start $REGISTRY_CONTAINER_NAME
  else
    echo "Creating and starting local registry..."
    docker run -d -p 5000:5000 --name $REGISTRY_CONTAINER_NAME --restart=always registry:2
  fi
  sleep 5
fi
echo "Local registry is running at $REGISTRY"

# Step 2: Build, tag, and push images
for IMAGE_INFO in "${IMAGES[@]}"; do
  IMAGE_NAME_TAG=$(echo $IMAGE_INFO | awk '{print $1}')
  CONTEXT_DIR=$(echo $IMAGE_INFO | awk '{print $2}')

  IMAGE_NAME=$(echo $IMAGE_NAME_TAG | cut -d':' -f1)
  TAG=$(echo $IMAGE_NAME_TAG | cut -d':' -f2)

  echo "--------------------------------------"
  echo "Building $IMAGE_NAME:$TAG from $CONTEXT_DIR"

  docker build -t $IMAGE_NAME:$TAG $CONTEXT_DIR
  docker tag $IMAGE_NAME:$TAG $REGISTRY/$IMAGE_NAME:$TAG
  docker push $REGISTRY/$IMAGE_NAME:$TAG

  # Step 3: Remove the local images after push
  echo "Removing local images for $IMAGE_NAME:$TAG..."
  docker rmi $IMAGE_NAME:$TAG -f

done

echo "--------------------------------------"
echo "All images built and pushed to $REGISTRY!"