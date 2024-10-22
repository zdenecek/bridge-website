---
title: Czech player database in UTF-8 csv
date: 2024-08-30
translationKey: matrika-cbs-utf8
---

The CBS Registry is software used for managing membership databases and
tournaments. Unfortunately, the player export is in Windows-1250 encoding, which
is unfortunate.

Below, you can download the player list in UTF-8 encoding, which is truly COMMA
SEPARATED VALUES, that is, with commas.

It is also possible to remap the columns for compatibility with Tournament
Calculator. The file can then be uploaded to the Tournament Calculator as a
player database (Custom option).

The data are live from the CBS Registry, so they are always up-to-date.

<form action="matrikaCSV.php" method="GET"> 
    <button class="x-button" type="submit">Click here to download the file</button> <br> 
    <label> 
    <input type="checkbox" name="remap_columns" value="1" checked> Remap columns for compatibility with Tournament Calculator 
    </label> 
</form>ß
