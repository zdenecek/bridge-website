---
title: Download the Player List from MatrikaCBS player database in UTF-8
date: 2024-08-30
---

The CBS Registry is software used for managing membership databases and
tournaments. Unfortunately, the player export is in Windows-1250 encoding, which
is unfortunate.

Below, you can download the player list in UTF-8 encoding, which is truly COMMA
SEPARATED VALUES, that is, with commas.

It is also possible to remap the columns for compatibility with Tournament
Calculator. The file can then be uploaded to the Tournament Calculator as a
player database (Custom option).

<form action="matrikaCSV.php" method="GET"> 
    <button class="x-button" type="submit">Click here to download the file</button> <br> 
    <label> 
    <input type="checkbox" name="remap_columns" value="1" checked> Remap columns for compatibility with Tournament Calculator 
    </label> 
</form>ß
