---
title: Nástroje pro převody dat z turnajů
date: 2024-04-30
---

Řízení turnajů je provázeno využíváním různého software, různých mnohdy starých,
proprietárních, nedokumentovaných aplikací. Tyto aplikace, ať už nové či staré,
často neumožňují export dat do formátů, které by byly snadno zpracovatelné.
Výsledkem je, že data z turnajů jsou často ztracena, nebo jsou zpracována ručně,
což je časově náročné a chybové.

Tyto programy jsou mimo jiné:

- `Giborg` Dušana Šlachty: spousta různých textových výstupů, umožňuje export do GoodLucku
- `GoodLuck` Eda Veleckého: webová prezentace turnajů, pracuje s adresářovou strukturou s csv soubory 
- Program pro skupinovky Petra Bahníka: exportuje do textových a pdf souborů, dokáže také exportovat csv s výsledky partií
- [`BridgeMate Control`](https://support.bridgemate.com/en/support/solutions/articles/44002262504-bridgemate-control-software-3-9-9): bridgematy pracují s binárním souborem databáze MS Access 1997 a 1999, pro jehož čtení je potřeba legacy komponent DotNET Frameworku.
- [`Tournament Calculator`](https://tournamentcalculator.com/) Stanislawa Mączky: Přestože se jedná o nový program, který umožňuje export do různých bridgových platforem, jednoduché exporty do csv chybí. Mnoho dat lze extrahovat z exportu do PBN a také z json souborů generovaných pro webovou prezentaci.
- [Matrika ČBS](https://www.matrikacbs.cz/): export hráčů je sice v csv, ale bohužel v kódování Windows-1250, což je pro dnešní dobu nepřijatelné.  Vstup pro vytváření turnajů je uzpůsoben pro Giborg, naštěstí existuje také možnost importu z csv. Dokumentace neexistuje, je nutno znát formát vstupu.
- [`bridge-results-presentation`](https://github.com/zdenecek/bridge-results-presentation): moje prezentace, zatím pro skupinovky v BKP, využívá skript na převod z souborů produkováních programem pro skupinovky.

V tomto článku popíšu nástroje, které jsem si vytvořil pro převody dat z turnajů
pro různé potřeby vedoucího turnajů.

## Nahrání párových turnajů z `Tournament Calculator` do Matriky ČBS

Lze využít soubor `results.json`, který je generován v kořenovém adresáři webové prezentace turnajů.

Pro převod použiju nasledující [`jq`](https://jqlang.github.io/jq/) query:

```bash
.Results[] | ( [
     .Place, 
    ( ( .Result._pointsDecimal * 100) |  round / 100 ) ,
    ( [ .Participant._person1._lastName , .Participant._person2._lastName ] | join(" - ") ), 
    ( .Participant._person1._pid.Number | if . > 10000 then "" else . end )  ,
    ( .Participant._person2._pid.Number | if . > 10000 then "" else . end  ) ] ) 
    | join(",")
```

`jq` lze spustit z příkazové řadky

```bash
curl --silent https://bridge.zdenektomis.eu/vysledky/2024/slavonice/pary-ctvrtek/results.json | jq --raw-output '.Results[] | ( [
     .Place, 
    ( ( .Result._pointsDecimal * 100) |  round / 100 ) ,
    ( [ .Participant._person1._lastName , .Participant._person2._lastName ] | join(" - ") ), 
    ( .Participant._person1._pid.Number | if . > 10000 then "" else . end )  ,
    ( .Participant._person2._pid.Number | if . > 10000 then "" else . end  ) ] ) 
    | join(",")'
```

Případně jde využít také webovou službu [jqplay](https://jqplay.org/), kde lze vložit vstupní json a query a získat výstup, zde je odkaz na kokrétní [dotaz](https://jqplay.org/s/DOj9fIVDFzJ).

