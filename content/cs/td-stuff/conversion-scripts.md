---
title: Nástroje pro převody dat z turnajů
date: 2024-04-30
url: prevody-dat
draft: true
---

Řízení turnajů je provázeno využíváním různého software, různých mnohdy starých,
proprietárních, nedokumentovaných aplikací. Tyto aplikace, ať už nové či staré,
často neumožňují export dat do formátů, které by byly snadno zpracovatelné.
Výsledkem je, že data z turnajů jsou často ztracena, nebo jsou zpracována ručně,
což je časově náročné a chybové.

Tyto programy jsou mimo jiné:

- _Giborg_ Dušana Šlachty: spousta různých textových výstupů, umožňuje export do GoodLucku
- _GoodLuck_ Eda Veleckého: webová prezentace turnajů, pracuje s adresářovou strukturou s csv soubory 
- Program pro skupinovky Petra Bahníka: exportuje do textových a pdf souborů, dokáže také exportovat csv s výsledky partií
- [BridgeMate Control](https://support.bridgemate.com/en/support/solutions/articles/44002262504-bridgemate-control-software-3-9-9): bridgematy pracují s binárním souborem databáze MS Access 1997 a 1999, pro jehož čtení je potřeba legacy komponent DotNET Frameworku.
- [Tournament Calculator](https://tournamentcalculator.com/) Stanislawa Mączky: Přestože se jedná o nový program, který umožňuje export do různých bridgových platforem, jednoduché exporty do csv chybí. Mnoho dat lze extrahovat z exportu do PBN a také z json souborů generovaných pro webovou prezentaci.
- [Matrika ČBS](https://www.matrikacbs.cz/): export hráčů je sice v csv, ale bohužel v kódování Windows-1250, což je pro dnešní dobu nepřijatelné.  Vstup pro vytváření turnajů je uzpůsoben pro Giborg, naštěstí existuje také možnost importu z csv. Dokumentace neexistuje, je nutno znát formát vstupu.
- [bridge-results-presentation](https://github.com/zdenecek/bridge-results-presentation): moje prezentace, zatím pro skupinovky v BKP, využívá skript na převod z souborů produkováných programem pro skupinovky.

## Repozitář se skripty

Pro převod jsem si vytvořil pár skriptů, jsou dostupné 
na [Githubu](https://github.com/zdenecek/bridge-scripts)

## Podporované funkce

Zatím jsou dostupné následující funkce:

- Nahrání turnajů z Tournament Calculator do Matriky ČBS, pro párové, týmové i individuální turnaje
- Stažení csv souboru z Matriky ČBS a převod do formátu pro TournamentCalculator. Serverový skript, [který je nasazen na tomto webu]()

Pro návod k použití spusťte skript s parametrem `--help` nebo se podívejte do souboru skriptu.
