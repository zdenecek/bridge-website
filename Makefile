PYTHON=python3


all: site

watch: tournaments
	hugo server --minify --disableFastRender --watch  --buildFuture

.PHONY: tournaments site clean all

site: tournaments
	hugo --minify --buildFuture

tournaments: 
	${PYTHON} bin/convert.py data/tournaments.json en:tournaments,cs:turnaje cs
	${PYTHON} bin/convert.py data/bkpTournaments.json en:bkp-tournaments,cs:turnaje-v-bk-praha cs

clean: 
	./bin/clean.sh en/tournaments cs/turnaje cs/turnaje-v-bk-praha en/bkp-tournaments 