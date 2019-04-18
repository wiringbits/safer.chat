#!/bin/bash
set -e
cd ../../server/ && sbt dist && cd -
cp ../../server/target/universal/chat-server-0.1.0-SNAPSHOT.zip app.zip
