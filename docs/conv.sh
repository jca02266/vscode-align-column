#!/bin/sh

framerate=24

for i in mov/*.mov
do
  echo $i
  # ffmpeg -i $i -r $framerate $(basename $i .mov).gif
  docker-compose run --rm app -stats -y -i /app/$i -r $framerate /app/gif/$(basename $i .mov).gif
done
