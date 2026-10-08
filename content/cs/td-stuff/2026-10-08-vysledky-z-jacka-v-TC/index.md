---
title: Výsledky z Jacka v Tournament Calculatoru
date: 2026-10-08
---

- [Jak to funguje](#jak-to-funguje)
- [Co budete potřebovat](#co-budete-potřebovat)
- [1. Jack odehraje rozdání](#1-jack-odehraje-rozdání)
- [2. Turnaj v TC](#2-turnaj-v-tc)
- [3. Vytvoření BWS](#3-vytvoření-bws)
- [4. Zápis výsledků Jacka do BWS](#4-zápis-výsledků-jacka-do-bws)
- [5. Načtení výsledků v TC](#5-načtení-výsledků-v-tc)
- [Když něco nefunguje](#když-něco-nefunguje)
- [Odkazy](#odkazy)

Návod, jak do turnaje v Tournament Calculatoru (TC) přidat srovnávací pole,
které odehrál Jack. Hodí se pro turnaje s malým počtem stolů, kde se hráči
srovnávají i s roboty. Takto se hrál
[TOPový přebor BK Praha](https://vysledky.bkpraha.cz/prezentace/2026/top-prebor/):
8 stolů hráčů a 15 stolů Jacka.

> Na dohrávky skupinovek TC ani BWS nepotřebujete, stačí
> [Dohrávky proti Jackovi]({{< relref "/td-stuff/2026-10-05-dohravky-proti-jackovi" >}}).

## Jak to funguje

- Turnaj v TC má dvě sekce: **A** pro hráče a **B** pro roboty. Sekce B má
  tolik stolů, kolik stolů odehrál Jack (15 nebo 20).
- TC vytvoří BWS (databázi pro bridgematy) pro obě sekce.
- Skript [pbn2bws](https://github.com/zdenecek/pbn2bws) zapíše výsledky Jacka
  do BWS ke stolům sekce B, jako by je zadaly bridgematy. Stůl B1 dostane
  výsledky prvního stolu Jacka, B2 druhého atd.
- TC výsledky robotů načte z BWS spolu s výsledky hráčů a počítá je do
  matchpointů nebo průměrů jako kterýkoli jiný stůl.

## Co budete potřebovat

- Rozdání v PBN, obvykle od Adama.
- Jack a Tournament Calculator, oba běží jen na Windows.
- Python 3.12 a Java 17 pro skript pbn2bws. Skript běží na Windows i na
  Macu, nejjednodušší je pustit ho na stejném počítači, kde běží TC.

## 1. Jack odehraje rozdání

1. Otevřete Jack a zvolte **File → Create Tournament → Use deals from a PBN
   File**. Soubor s rozdáními nesmí být na připojeném Google Disku, musí ležet
   na lokálním disku.
2. **File → Create tournament with replay Jack → OK.**
3. Vyplňte název, vyberte **Compensation**, počet stolů (**15** nebo **20**,
   stejně jako bude mít sekce B v TC) a zaškrtněte **Random convention cards**
   a **Store bidding and play**.
4. Vyberte, kam turnaj uložit (zase ne na Google Disk). Soubor pojmenujte
   stejně jako rozdání, jen s příponou `.jack.pbn`, např. `26top01.jack.pbn`.
5. Počkejte, až Jack dohraje, trvá to asi 2 hodiny.

Ve výsledném PBN je každé rozdání tolikrát, kolik stolů Jack odehrál (28
rozdání × 15 stolů = 420 her).

## 2. Turnaj v TC

Turnaj pro hráče (sekce A) založte jako obvykle, viz
[Klubové turnaje v TC]({{< relref "/td-stuff/2024-02-14-klubove-turnaje-v-TC" >}})
a [Složitější párové turnaje]({{< relref "/td-stuff/2024-03-02-slozitejsi-parove-turnaje-a-postupy-v-TC" >}}).
Navíc přidejte sekci **B** pro roboty:

- **Stolů je tolik, kolik jich odehrál Jack** (15 nebo 20). Skript vyplní
  stoly B1 až B15 (B20), další stoly by zůstaly prázdné.
- **Každý stůl B odehraje všechna rozdání**, každé právě jednou. Na TOP přeboru
  se hrálo 14 sestav po 2 rozdáních, takže stůl B1 hrál 1–2, 3–4, …, 27–28.
- **Stoly B hrají stejné krabice jako sekce A**, se stejnými čísly rozdání.
- **Páry robotů číslujte od 101**, ať se nepletou s hráči (u 15 stolů 101–130).
  V záložce `Participants` je přidáte tlačítkem `+` a rozsahem `101-130`. Jako
  jméno stačí `Robot - Robot`.

Výpočet nastavte jako obvykle: u párového turnaje matchpointy, u skupinovky
IMPy proti průměru. Na TOP přeboru se matchpointy počítaly z 23 výsledků na
rozdání (8 stolů hráčů a 15 robotů).

Do záložky `Calculation` nahrajte PBN s rozdáními jako u každého turnaje.
Použijte původní soubor s rozdáními, ne `.jack.pbn`.

## 3. Vytvoření BWS

BWS vytvořte v záložce `BWS` tlačítkem `Create new BWS` a vyberte všechna kola
(`All`). Postup je stejný jako v
[článku o klubových turnajích]({{< relref "/td-stuff/2024-02-14-klubove-turnaje-v-TC" >}}#vytvoření-bws-databáze-a-spuštění-bridgematů).

V nastavení bridgematů tentokrát **nezaškrtávejte `Run BCS`**. Do BWS nejdřív
zapíšete výsledky robotů a BCS spustíte až potom.

Pod tlačítky v záložce `BWS` se ukáže cesta k souboru
(`Reading from BWS: C:\...\turnaj.bws`). S tímto souborem budete dál pracovat.

## 4. Zápis výsledků Jacka do BWS

### Instalace (jen poprvé)

Na Windows:

1. Nainstalujte [Python 3.12](https://www.python.org/downloads/) a při
   instalaci zaškrtněte **Add Python to PATH**.
2. Nainstalujte Javu 17, např.
   [Temurin 17](https://adoptium.net/temurin/releases/?version=17).
3. Nastavte proměnnou `JAVA_HOME` na složku s Javou (v PowerShellu, cestu
   upravte podle skutečné verze) a otevřete nový PowerShell:

   ```powershell
   [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.X-hotspot", "User")
   ```

4. Stáhněte skript z [GitHubu](https://github.com/zdenecek/pbn2bws)
   (`Code → Download ZIP`), rozbalte ho a ve složce skriptu nainstalujte
   závislosti:

   ```powershell
   py -3.12 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

   Pokud PowerShell `Activate.ps1` zablokuje, spusťte jednou
   `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

Instalace na Macu je popsaná v
[README skriptu](https://github.com/zdenecek/pbn2bws#macos).

### Spuštění

Zavřete BCS, pokud běží. Ve složce skriptu (s aktivovaným `.venv`) spusťte:

```powershell
python pbn_to_bws.py C:\turnaje\turnaj.bws C:\turnaje\26top01.jack.pbn --section-id 2 --tables-to-fill 15
```

- první cesta je BWS z TC, druhá PBN z Jacka,
- `--section-id` je číslo sekce robotů v BWS: A = 1, B = 2 (výchozí 2),
- `--tables-to-fill` je počet stolů robotů (výchozí 20).

Skript musí běžet ve své složce, jinak nenajde knihovny ve složce `lib`.

Výstup pro 15 stolů a 28 rozdání po 2 rozdáních v sestavě:

```text
Backup: C:\turnaje\turnaj.bws.bak.20260916-175242
PBN: 28 boards, 420 deals
Movement: 210 (section, table, round) entries for tables 1..15
Inserted 420 ReceivedData rows (0 skipped — no PBN deal).
```

Zkontrolujte, že zapsaných výsledků je stoly × rozdání (15 × 28 = 420) a že
nic nebylo přeskočeno. Přeskočené výsledky znamenají, že v PBN chybí rozdání
z rozpisu.

Před zápisem skript BWS zazálohuje (`turnaj.bws.bak.<datum-čas>`). **Na jednu
BWS ho spusťte jen jednou**, další spuštění by výsledky zapsalo podruhé. Pro
nový pokus se vraťte k záloze.

Pokud skript pouštíte na jiném počítači než TC, zkopírujte BWS zpět přesně na
cestu, kterou TC ukazuje v záložce `BWS`.

## 5. Načtení výsledků v TC

TC čte výsledky z BWS průběžně, stejně jako výsledky z bridgematů. V záložce
`Calculation` by se u každého rozdání měly objevit výsledky všech stolů B.

Pak v záložce `BWS` spusťte BCS zeleným tlačítkem `Run BCS` a hrajte jako
obvykle. Výsledky hráčů přibývají do stejné BWS a TC je počítá proti celému
poli včetně robotů.

## Když něco nefunguje

- **Výsledky robotů se v TC neobjeví.** Ověřte, že TC čte stejný soubor, do
  kterého zapisoval skript (cesta v záložce `BWS`), a že `--section-id` a
  `--tables-to-fill` odpovídají sekci robotů. Pokud ano, vezměte zálohu
  `.bak`, spusťte skript na ni znovu a v TC ji připojte jako BWS.
- **Robotům chybí některá rozdání.** Některý stůl B nehraje všechna rozdání.
  Opravte rozpis sekce B, vytvořte novou BWS a skript spusťte znovu.
- **Několik stolů má stejné výsledky.** PBN má méně stolů Jacka, než má sekce
  B stolů, a skript výsledky opakuje. Nechte Jacka odehrát víc stolů, nebo
  zmenšete sekci B.

## Odkazy

- [pbn2bws na GitHubu](https://github.com/zdenecek/pbn2bws) – skript pro zápis
  výsledků z PBN do BWS
- [Dohrávky proti Jackovi]({{< relref "/td-stuff/2026-10-05-dohravky-proti-jackovi" >}})
- [Klubové turnaje v TC]({{< relref "/td-stuff/2024-02-14-klubove-turnaje-v-TC" >}})
- [Bridgematy – užitečné informace]({{< relref "/td-stuff/2025-11-21-bridgemates" >}})
- [Bridgemate Developer's Guide](https://support.bridgemate.com/en/support/solutions/articles/44001826953-download-bridgemate-developer-s-guide)
  – popis BWS a tabulky `ReceivedData`
