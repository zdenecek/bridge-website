---
title: PBN - portable bridge notation 
url: pbn
date: 2024-04-12
---

PBN is a command line tool for working with Portable Bridge Notation files.

PBN is written in dotnet core with C#.

Intended use is on Windows as it comes with the `dds` library windows binary.

## Supported functions

- parse a file and validate it
- print an overview with information about a file
- strip a file of unnecessary parts
- add double dummy analysis to a file (thanks to the [dds library](https://github.com/dds-bridge/dds))

## Where to get it

PBN is available on [Github](https://github.com/zdenecek/pbn).

For an executable, check the [releases section](https://github.com/zdenecek/pbn/releases).

## User manual

Run the program with the `--help` flag.

Similar user manual can also be found in [guide.md on Github](https://github.com/zdenecek/pbn/blob/master/guide.md).
