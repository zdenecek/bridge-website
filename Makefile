PYTHON=python3


all: site

watch: tournaments
	hugo server --minify --disableFastRender --watch  --buildFuture

.PHONY: tournaments site clean all

site: tournaments
	hugo --minify --buildFuture

tournaments: 
	${PYTHON} scripts/convert.py data/tournaments.json en:tournaments,cs:turnaje cs
	${PYTHON} scripts/convert.py data/bkpTournaments.json en:bkp-tournaments,cs:turnaje-v-bk-praha cs

clean: 
	./scripts/clean.sh en/tournaments cs/turnaje cs/turnaje-v-bk-praha en/bkp-tournaments 