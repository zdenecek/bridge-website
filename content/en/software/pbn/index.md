---
title: PBN - portable bridge notation 
date: 2024-04-12
layout: single
url: /pbn
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

Pre-built executables are available in the [releases section](https://github.com/zdenecek/pbn/releases).

### Building from sources

The project includes a CMake configuration to build from sources, see the [README](https://github.com/zdenecek/pbn/readme.md) for more information.

You can either build the project using dotnet with the provided prebuild `dds` binaries or build the whole project with CMake.

This includes building the `dds` library from sources, which is a bit more complicated but should work. It opens the possibility to use the library on other platforms. I have tested this on M1 Mac, where it works.

## User manual

Available in the [user guide](/en/software/pbn/guide).

Run the program with the `--help` flag.

## License

PBN is licensed under the MIT license.

The DDS library used for double dummy analyses is licensed under the Apache 2.0 license.
