PYTHON = python3


.PHONY: tournaments clean

tournaments: 
	PYTHON3 scripts/convert.py data/tournaments.json content/tournaments/

clean: 
	rm -rf content/tournaments/* ^_index.md