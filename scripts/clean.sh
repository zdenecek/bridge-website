#!/bin/bash

# Capture all arguments as directories
directories=("$@")

# Iterate over the  and directories
for dir in "${directories[@]}"; do
    mv "content/${dir}/_index.md" "_index.md.bak"
    rm -f "content/${dir}"/*
    mv "_index.md.bak" "content/${dir}/_index.md"
done

rm -r public/ 