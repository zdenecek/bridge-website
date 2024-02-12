PYTHON = python3


all: site

watch:
	hugo server --minify --disableFastRender --watch

.PHONY: tournaments site clean all

site: tournaments
	hugo --minify --verbose

tournaments: 
	${PYTHON3} scripts/convert.py data/tournaments.json content/tournaments/
	${PYTHON3} scripts/convert.py data/bkpTournaments.json content/bkp-tournaments/

clean: 
	mv content/tournaments/_index.md _index.md.bak
	rm content/tournaments/* 
	mv _index.md.bak content/tournaments/_index.md
	mv content/bkp-tournaments/_index.md _index.md.bak
	rm content/bkp-tournaments/* 
	mv _index.md.bak content/bkp-tournaments/_index.md