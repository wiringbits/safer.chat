#!/bin/bash
set -e
cd ../../web/ && ng build --prod && zip -r web.zip dist/* && cd -
mv ../../web/web.zip web.zip
