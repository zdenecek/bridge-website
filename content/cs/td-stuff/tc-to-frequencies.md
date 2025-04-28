---
title: Frekvence a průměry z Tournament Calculator prezentace
date: 2025-04-28
translationKey: tc-to-freq
url: tc-freq
---

# Frekvence a průměry z Tournament Calculator prezentace

Tento nástroj umožňuje zpracovat výsledky z Tournament Calculator prezentace a zobrazit frekvence a průměry pro každou partii. Nástroj je užitečný zejména pro:

- Rychlé zobrazení frekvencí výsledků na jednotlivých partiích
- Výpočet průměrů s možností vyloučení extrémních výsledků
- Zpracování výsledků z libovolného počtu partií najednou

## Jak nástroj používat

1. **URL prezentace**: Zadejte základní URL adresu Tournament Calculator prezentace (kde jsou umístěny JSON soubory)
2. **Rozsah partií**: Vyberte rozsah partií, které chcete zpracovat
   - Můžete použít rychlý výběr pro celé kolo zadáním počtu partií na kolo
3. **Filtrování pro průměry**: Volitelně můžete vybrat metodu filtrování pro výpočet průměrů
   - Použít všechny výsledky
   - Vyloučit určitý počet nejlepších a nejhorších výsledků
   - Vyloučit určité procento nejlepších a nejhorších výsledků

## Výstup

Nástroj poskytuje tři typy výstupů:

1. **Frekvence**: Pro každou partii zobrazí četnost jednotlivých výsledků
2. **Jednoduché průměry**: Seznam partií s jejich průměry ve formátu `číslo_partie průměr`
3. **Detailní výpočty**: Podrobný výpis pro každou partii včetně:
   - Použité metody filtrování
   - Vypočteného průměru
   - Seznamu započtených a vyloučených výsledků

Všechny výstupy lze snadno zkopírovat do schránky nebo stáhnout jako textový soubor.

## Technické detaily

- Čísla partií odpovídají skutečným číslům partií v turnaji (ne pořadovým číslům souborů)
- Průměry jsou zaokrouhleny na celá čísla
- Při filtrování je vždy zachován alespoň jeden výsledek pro výpočet průměru
- Nástroj automaticky odstraňuje případné parametry a fragmenty z URL adresy

[Spustit nástroj](/scripts/tc-to-frequencies.php)
