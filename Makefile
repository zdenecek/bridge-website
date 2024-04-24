PYTHON=python3


all: site

watch: tournaments
	hugo server --minify --disableFastRender --watch  --buildFuture

.PHONY: tournaments site clean all

site: tournaments
	hugo --minify --buildFuture

tournaments: 
	${PYTHON} scripts/convert.py data/tournaments.json content/tournaments/
	${PYTHON} scripts/convert.py data/bkpTournaments.json content/bkp-tournaments/

clean: 
	mv content/tournaments/_index.md _index.md.bak
	rm content/tournaments/* 
	mv _index.md.bak content/tournaments/_index.md
	mv content/bkp-tournaments/_index.md _index.md.bak
	rm content/bkp-tournaments/* 
	mv _index.md.bak content/bkp-tournaments/_index.md