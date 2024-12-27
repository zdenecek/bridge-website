---
title: Nahrání turnajů z Tournament Calculator do Matriky ČBS
date: 2024-12-27
translationKey: tc-to-matrika
url: tc-matrika
---

Matrika ČBS podporuje nahrávání turnajů ve dvou formátech:

- textová tabulka generovaná z Giborgu (program Dušana Šlachty)
- csv soubor

Textovou tabulkou se nemá smysl zabývat, podívejme se na formát csv souboru.

## Formát csv souboru

Pro párové a individuální turnaje je formát csv souboru následující:

```text
umístění, výsledek, název, id hráčů ...
```

- `umístění` - pořadí v turnaji (pro sdílené umístění se používá nejvyšší, např 1 .. 1 .. 3 pro 1-2. a potom třetí místo )
- `výsledek` - libovolný text
- `název`, pokud mají všichni hráči ID, doporučuji vynechat, jinak lze uvést jména.
- `id hráčů` - ID hráčů, libovolný počet sloupců (oddělených oddělovačem, např. čárkou)

Bohužel matrika přijímá "České csv", tedy s oddělovačem středníkem a kódováním Windows-1250.

## Převod z Tournament Calculator

Pro převod z Tournament Calculator jsem vytvořil udělátko. Je potřeba mít webovou prezentaci.

[Udělátko na převod z Tournament Calculator](/apps/tc-to-matrika)
