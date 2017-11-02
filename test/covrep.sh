#!/bin/bash
WORKDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

FILE="$WORKDIR/../coverage/coverage.html"
if [[ "$OSTYPE" == *"linux"* ]]; then xdg-open $FILE
  else open $FILE
fi