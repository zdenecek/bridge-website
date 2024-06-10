PYTHON=python3


all: site

watch: tournaments
	hugo server --minify --disableFastRender --watch  --buildFuture

.PHONY: tournaments site clean all

site: tournaments
	hugo --minify --buildFuture

tournaments: 
	${PYTHON} scripts/convert.py data/tournaments.json tournaments cs
	${PYTHON} scripts/convert.py data/bkpTournaments.json bkp-tournaments cs

clean: 
	./scripts/clean.sh