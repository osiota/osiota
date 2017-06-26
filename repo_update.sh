#!/bin/sh

echo "energy-router"
git pull

cd ..
for i in er-app-*/;
do
	echo
	echo "${i}"
	cd "${i}"
	git pull
	cd - >/dev/null
done
