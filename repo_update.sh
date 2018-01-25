#!/bin/sh

COMMAND="$1"

if test "x$COMMAND" = "x"
then
	echo "Usage:"
	echo "repo_update.sh status"
	echo "repo_update.sh pull"
	exit 2
fi

echo "energy-router"
git "$COMMAND"

cd ..
for i in er-app-*/;
do
	echo
	echo "${i}"
	cd "${i}"
	git "$COMMAND"
	cd - >/dev/null
done
