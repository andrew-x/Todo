#!/bin/bash
FILE_PATH=$(jq -r '.tool_input.file_path')

# Only format code files
[[ ! "$FILE_PATH" =~ \.(tsx?|jsx?|css)$ ]] && exit 0

# Format then lint
bunx prettier --write "$FILE_PATH" 2>/dev/null
bunx eslint --fix "$FILE_PATH" 2>/dev/null

exit 0
