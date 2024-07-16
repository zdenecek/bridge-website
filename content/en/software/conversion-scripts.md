---
title: Tools for bridge data conversions
date: 2024-04-30
url: conversion-scripts
---

Tournament management involves the use of various software, often old, proprietary, and undocumented applications. Whether new or old, these applications frequently do not allow for data export to formats that are easily processed. As a result, data from tournaments is often lost, or manually processed, which is time-consuming and error-prone.

These programs include:

- _Giborg_ by Dušan Šlachta: produces various text outputs, allows export to GoodLuck
- _GoodLuck_ by Ed Velecký: web presentation of tournaments, works with a directory structure of CSV files
- Team Tournament Program by Petr Bahník: exports to text and PDF files, can also export CSV files with match results
- [BridgeMate Control](https://support.bridgemate.com/en/support/solutions/articles/44002262504-bridgemate-control-software-3-9-9): BridgeMates work with a binary MS Access 1997 and 1999 database file, which requires legacy DotNET Framework components to read.
- [Tournament Calculator](https://tournamentcalculator.com/) by Stanisław Mączka: Although this is a new program that allows export to various bridge platforms, simple exports to CSV are missing. Much data can be extracted from exports to PBN and from JSON files generated for web presentation.
- [Matrika ČBS](https://www.matrikacbs.cz/): player export is in CSV, but unfortunately in Windows-1250 encoding, which is unacceptable today. Input for creating tournaments is adapted for Giborg, but fortunately, there is also the option to import from CSV. Documentation does not exist; one must know the input format.
- [bridge-results-presentation](https://github.com/zdenecek/bridge-results-presentation): my presentation, currently for team events in BKP, uses a script to convert from files produced by the team event program.

## Repository with scripts

I have created a few scripts for conversion, which are available on [Github](https://github.com/zdenecek/bridge-scripts).

## Supported functions

Currently, the following functions are available:

- Upload tournaments from Tournament Calculator to Matrika ČBS, for pairs, teams, and individual tournaments

For instructions on how to use, run the script with the `--help` parameter or look into the script file.
