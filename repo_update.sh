#!/bin/sh

SCRIPTPATH="$(readlink -f "$0" 2>/dev/null || perl -MCwd -e 'print Cwd::abs_path shift' "$0")"
SCRIPTDIR="$(dirname "${SCRIPTPATH}")"
GG="${SCRIPTDIR}/.gitignore_global"

COMMAND="$*"
if test "x$COMMAND" = "x"
then
	echo "Usage:"
	echo "repo_update.sh status"
	echo "repo_update.sh pull"
	exit 2
fi

if test "x$COMMAND" = "xstatus"
then
	COMMAND="status -s"	
fi

echo "osiota"
git -c core.excludesfile="${GG}" $COMMAND

for i in er-app-*/ osiota-app-*/ system-*/ ../er-app-*/ ../osiota-app-*/ ../system-*/;
do
	if test -d "$i.git"
	then
		echo
		echo "${i}"
		cd "${i}"
		git -c core.excludesfile="${GG}" $COMMAND
		cd - >/dev/null
	elif test -d "$i"
	then
		echo
		echo "${i}"
		echo "Not a git repository"
	fi
done
