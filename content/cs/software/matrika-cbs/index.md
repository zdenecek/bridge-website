---
title: Seznam hráčů z Matriky ČBS v UTF-8
date: 2024-08-30
url: matrika-cbs
---

Matrika ČBS je software, který se používá pro správu členských základů a turnajů. Bohužel, export hráčů je v kódování Windows-1250.

Níže můžete stáhnout seznam hráčů v kódování UTF-8, které je opravdu **comma** separated values, tedy s čárkami.

Dále je možné přemapovat sloupce pro kompatibilitu s Tournament Calculator. Soubor je pak možné nahrát do Tournament Calculatoru jako databázi hráčů (možnost Custom).

Data jsou přímo generovaná z Matriky ČBS, takže jsou vždy aktuální.
 
<form action="matrikaCSV.php" method="GET">
    <button class="x-button" type="submit">Klikněte zde pro stažení souboru</button>
    <br>
    <label>
        <input type="checkbox" name="remap_columns" value="1" checked>
       Přemapovat sloupce pro kompatibilitu s Tournament Calculator
    </label>
</form>
