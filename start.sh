#!/usr/bin/env bash

nodemon -w css -w media -w templates -w . -e ejs,js,css,avif ./app.js 8080
