Simple Anime list to MyAnimeList import XML converter

Utilises https://jikan.moe/ for fetching MAL anime ID's

**Only works for Anime**

**This is NOT setup to work with Manga/Manhua**

Example supported list format:

- Horizontal

```
Title,Score,EpWatched,Status,Date,#Title,Score...
```

- Vertical

```
Title,Score,EpWatched,Status,Date,#
Title,Score...
```

All options can be adjusted in the config. Ther are applied as follows:

```
...EpWatched<-EntryDataDivider->Status<-EntryDataDivider->Date<-SplitCharacter->Title<-EntryDataDivider->Score<-EntryDataDivider->...
```

Real world example
```
Oshi no Ko,9,11 / 11,Geschaut,2023-07-13,#Oshi no Ko Season 2,9,13,Geschaut,2024-10-07
```

**EpWatched** can be either:
- Number Watched (5)
- Number Watched / Total (5 / 10) <-- Whitespace & "/" matters!

Requirements:
- [Nodejs](https://nodejs.org/en/download) installed & Added to PATH
- Terminal to run `node index.js` in
- **Correctly Formatted** list to parse

[Link to MAL Import Page](https://myanimelist.net/import.php)

Output will be store in the `output.xml` file.

**Make sure you do not have any trailing characters after the last date entry!**

(Can be used to import data from Proxer to MAL by copy pasting and modifying the UCP Anime list, score needs to be added manually 😉)