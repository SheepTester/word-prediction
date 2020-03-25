# My directory structure was
# - Documents
# | detex.exe
# | - test
#   | - gatm
#     | [this file]
#
# detex.exe was from https://code.google.com/archive/p/opendetex/downloads

echo "" > gatm.txt

for file in {,**/}*.tex
do
  ../../detex.exe "$file" >> gatm.txt
done
