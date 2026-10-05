---
title: Dohrávky proti Jackovi
date: 2026-10-05
---

- [Příprava rozdání v Jacku](#příprava-rozdání-v-jacku)
- [Jak se dohrávka počítá](#jak-se-dohrávka-počítá)
- [Co budete potřebovat](#co-budete-potřebovat)
- [Založení dohrávky](#založení-dohrávky)
- [Přepsání lístečku](#přepsání-lístečku)
- [Přepis z fotky pomocí AI](#přepis-z-fotky-pomocí-ai)
- [Další stoly na stejných rozdáních](#další-stoly-na-stejných-rozdáních)
- [Uložení](#uložení)
- [Výsledky na webu](#výsledky-na-webu)

Návod, jak spočítat dohrávku skupinovky (zápas odehraný v náhradním termínu)
bez BWS, Bridgematů a Tournament Calculatoru. Srovnávací pole odehraje Jack,
výsledky z lístečku se zadají rovnou do
[prezentace výsledků](https://vysledky.bkpraha.cz) a ta dopočítá průměry,
IMPy i VP.

## Příprava rozdání v Jacku

1. Soubor s rozdáními (PBN) obvykle dodá Adam. **Jen v nouzi**, když ho
   nemáte, vygenerujte rozdání sami programem BigDeal, `28` je počet rozdání.
   Program se zeptá na název souboru bez přípony, např. `26doh01`.

   ```text
   bigdeal.exe -n 28
   ```

2. Otevřete Jack a zvolte **File → Create Tournament → Use deals from a PBN
   File**. Soubor s rozdáními nesmí být na připojeném Google Disku, musí ležet
   na lokálním disku.
3. **File → Create tournament with replay Jack → OK.**
4. Vyplňte název, vyberte **Compensation**, **20** stolů a zaškrtněte
   **Random convention cards** a **Store bidding and play**.
5. Vyberte, kam turnaj uložit (zase ne na Google Disk). Soubor pojmenujte
   stejně jako rozdání, jen s příponou `.jack.pbn`, např. `26doh01.jack.pbn`.
6. Počkejte, až Jack dohraje, trvá to asi 2 hodiny.

Výsledný soubor `.jack.pbn` pak nahrajete do dohrávky.

## Jak se dohrávka počítá

- Rozdání dohrávky odehraje Jack na 15–20 stolech. To je srovnávací pole.
- Průměr rozdání se počítá ze všech výsledků Jacka **a ze všech stolů
  dohrávky** hraných na stejných rozdáních. Z každé strany se ořízne 10 %
  výsledků (u 16 výsledků tedy 1,6 nejlepšího a 1,6 nejhoršího) a průměr se
  zaokrouhlí na desítky – stejně jako u běžných kol skupinovek.
- Každý výsledek se přepočte na IMPy proti průměru a součet IMPů za zápas na VP
  (stupnice WBF pro 28 rozdání).

## Co budete potřebovat

- PBN z Jacka se všemi odehranými stoly (viz
  [Příprava rozdání v Jacku](#příprava-rozdání-v-jacku)). Každé rozdání je v
  něm tolikrát, kolik stolů Jack odehrál (28 rozdání × 20 stolů = 560 her).
- Lístečky ze všech stolů dohrávky.
- Heslo k úpravám turnaje.

## Založení dohrávky

V [administraci](https://vysledky.bkpraha.cz/admin) otevřete turnaj a přepněte
na záložku **Dohrávky**.

[![Záložka Dohrávky v editoru turnaje](01-zalozka.png)](01-zalozka.png)

Klikněte na **Nová dohrávka**, vyplňte datum a nahrajte PBN z Jacka. Pod tím se
ukáže, kolik rozdání a stolů Jacka se načetlo.

[![Nová dohrávka s nahraným PBN](02-nova-dohravka.png)](02-nova-dohravka.png)

Dohrávka dostane označení podle dne, kdy ji zakládáte. To se objeví v odkazu na
její stránku.

## Přepsání lístečku

Klikněte na **Přidat zápis** a vyberte kolo a stůl zápasu, který se dohrával.
Odložené stoly jsou v nabídce označené „(odloženo)“. Pokud pár, který je v
rozpisu NS, seděl při dohrávce EW, zaškrtněte **NS pár z rozpisu seděl EW**.

Do textového pole přepište lísteček, jedno rozdání na řádek:

```text
1 4SW -1
2 6DW+1
13 3NTS =
144SxW-2
9 pass
```

- číslo rozdání, závazek s hlavním hráčem a výsledek (`=`, `+1`, `-2`),
- barvy anglickými písmeny `C D H S` (**S jsou piky**), bez trumfů `NT` nebo
  `BT`, případně symboly ♣♦♥♠; kontra `x`, rekontra `xx`,
- mezery nejsou nutné: bez mezery je poslední číslice před barvou výška
  závazku, takže `14SW-1` je rozdání 1 a `144SW-1` rozdání 14,
- skóre se nepíše, dopočítá se ze závazku.

Vpravo se hned ukáže výsledek zápasu. Řádky, kterým program nerozumí, jsou
červeně a nepočítají se. Chybějící rozdání se vypíšou.

[![Přepsaný lísteček](03-zapis.png)](03-zapis.png)

Pod **Rozpis po rozdáních** zkontrolujete každé rozdání: body, průměr a IMPy.

[![Rozpis po rozdáních](04-rozpis.png)](04-rozpis.png)

## Přepis z fotky pomocí AI

Tlačítko **Načíst z fotky** nad textovým polem pošle fotku lístečku do Gemini
(na mobilu jde rovnou vyfotit) a vyplní přepis i se skóre a jmény párů. Skóre
program porovná se závazkem a upozorní na řádky, kde nesedí. To je skoro vždy
špatně přečtený závazek, nejčastěji barva (♥ místo ♦) nebo hráč. Počítá se
podle závazku, takže řádek podle lístečku opravte.

Fotku můžete přepsat i v jiné AI (Claude, ChatGPT) a text vložit sami, třeba
s tímto zadáním:

```text
Přepiš tento lísteček, jeden řádek na rozdání:
číslo závazek+hráč výsledek skóre,
např. 2 6♦W +1 940 nebo 13 3NTS = 600.
Skóre opiš z lístečku bez znaménka.
```

[![Přepis z AI s upozorněním na nesedící skóre](05-ai.png)](05-ai.png)

## Další stoly na stejných rozdáních

Dohrávalo-li se na stejných rozdáních u více stolů, přidejte další **zápis do
téže dohrávky**, ne novou dohrávku. Průměry se počítají z Jacka i ze všech
stolů, takže se po přidání stolu změní i výsledek ostatních.

## Uložení

IMPy se samy propíšou do dohrávky v příslušném kole, v záložce kola uvidíte
výsledek i datum. Smazáním zápisu se stůl vrátí na „Odloženo“.

[![Vyplněná dohrávka v záložce kola](06-odklad.png)](06-odklad.png)

Nakonec zadejte heslo a turnaj uložte.

## Výsledky na webu

Ve výsledcích kola vedou IMPy dohrávky na stránku dohrávky.

[![Výsledky kola s dohrávkou](07-vysledky-kola.png)](07-vysledky-kola.png)

Na stránce dohrávky jsou všechny zápasy hrané na těchto rozdáních a u každého
rozdání výsledky Jacka (šedě) i stolů dohrávky.

[![Stránka dohrávky](08-stranka-dohravky.png)](08-stranka-dohravky.png)

[![Výsledky rozdání](09-rozdani.png)](09-rozdani.png)
