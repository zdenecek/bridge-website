---
title: Klubové turnaje v Tournament Calculator
date: 2024-02-12
---

Tento článek popisuje, jak využít Tournament Calculator pro pořádání klubových turnajů. Tedy párových turnajů s jednou sestavou.

## Vytvoření turnaje

Při vytváření turnaje máme v zásadě dvě možnosti:

1. Použíjeme průvodce (wizard), který nám dá na výběr z předdefinovaných střídaní, podle toho, kolik máme stolů a kolik rozdání chceme hrát. TC umí mnoho různých střídání. Střídací lístky pak můžeme vytisknout, případně můžeme střídat podle BridgeMate (Jména hráčů podporují až od verze 2).

2. Vytvoříme prázdný turnaj a střídání importujeme. Tento přístup má tu výhodu, že můžeme využít předpřipravené střídací lístky.

Pro import střídání je potřeba mít střídání ve formátu, který TC umí načíst. TC umí načíst střídání v `.csv` (formát hodnoty oddělené čárkou) a sice ve velmi jednoduchém formtu. Každý řádek představuje jedno kolo a stůl a má tuto podobu:

```
stůl,kolo,ns,ew,rozdání nejnižší,rozdání nejvyšší
```

Kde `ns` a `ew` jsou čísla párů.

Tento formát má jednu implikaci, a sice že pro turnaje, kde se hrají v jednom kole rozdání z nesouvislého intervalu (např. 1-3 a 7-9), je potřeba rozdělit kola na půlkola. Nic jako půlkola ale v TC neexistuje, každé kolo se rozdělí na dvě celá kola a celkový počet kol bude dvojnásobný.

Pro účely toho článku vytvořím turnaj ručně a střídání importuji. Jako příklad poslouží turnaj na čtyři stoly, použiju předpřipravený soubor se střídáním. 

### Postup

1. Otevřu TC
2. Dám File -> New -> Pairs


## Soubory ke stažení

- [Střídání pro BS Havířov](/soubory/movements/bk-havirov)
    Přepsáno podle laminovaných lístků v klubu