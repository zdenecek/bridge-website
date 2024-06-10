#!/bin/bash
languages=("en" "cs")
directories=("tournaments" "bkp-tournaments")
for lang in "${languages[@]}"; do
	for dir in "${directories[@]}"; do
        mv "content/${lang}/${dir}/_index.md" "_index.md.bak"
        rm -f content/${lang}/${dir}/* 
        mv "_index.md.bak" "content/${lang}/${dir}/_index.md"
    done
done