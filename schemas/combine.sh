#!/bin/bash

for i in `ls *.json`
do
	if test "x$i" != "xall.json" &&
		test "x$i" != "xall-map.json"
	then
		jq \
			--arg name "$(basename "${i}" .json)" \
			'. as $item | {} | .[$name] = $item' \
			"$i"
	fi
done | jq -s 'add | {"$defs": .}' >all.json

for i in `ls *.json`
do
	if test "x$i" != "xall.json" &&
		test "x$i" != "xall-map.json"
	then
		jq \
			--arg name "https://osiota.net/schemas/${i}" \
			'. as $item | {} | .[$name] = $item' \
			"$i"
	fi
done | jq -s 'add' >all-map.json
