#!/bin/bash

ffmpeg -i videoRaw.mkv -ss 00:00:43 -t 00:02:20 -c:v vp9 -c:a copy video.mkv
