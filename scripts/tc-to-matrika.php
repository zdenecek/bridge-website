<?php
/**
 * Convert Tournament Calculator results to matrikacbs.cz import format
 */

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['url'])) {
    $url = preg_replace('/#.*$/', '', $_GET['url']); // Remove fragment from URL
    $noname = isset($_GET['noname']);
    $tournamentType = $_GET['type'] ?? 'pair';

    function fetchAndProcessResults($url, $noname = false, $tournamentType = 'pair') {
        try {
            // Older Tournament Calculator versions serve results.json, newer ones results.json.gz
            $url = rtrim($url, '/');
            if (!preg_match('/results\.json(\.gz)?$/', $url)) {
                $url .= '/results.json';
            }

            $candidates = [$url];
            if (substr($url, -3) !== '.gz') {
                $candidates[] = $url . '.gz';
            }

            $jsonData = false;
            foreach ($candidates as $candidate) {
                if (!filter_var($candidate, FILTER_VALIDATE_URL)) {
                    throw new Exception("Invalid URL provided.");
                }
                $jsonData = @file_get_contents($candidate);
                if ($jsonData !== false) {
                    break;
                }
            }

            if ($jsonData === false) {
                throw new Exception("Failed to fetch data from URL: " . join(" or ", $candidates));
            }

            if (strncmp($jsonData, "\x1f\x8b", 2) === 0) {
                $jsonData = @gzdecode($jsonData);
                if ($jsonData === false) {
                    throw new Exception("Failed to decompress gzipped results");
                }
            }

            $data = json_decode($jsonData, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Invalid JSON data received");
            }

            $results = $data['Results'] ?? [];
            $files = [];

            if ($tournamentType === 'individual' || $tournamentType === 'pair') {
                $lines = [];
            
                // Helper function to get participant info based on tournament type
                $getParticipants = function ($result, $tournamentType) {
                    if ($tournamentType === 'individual') {
                        return [
                            'primary' => $result['Participant']['_person'] ?? null,
                            'secondary' => null,
                        ];
                    } elseif ($tournamentType === 'pair') {
                        return [
                            'primary' => $result['Participant']['_person1'] ?? null,
                            'secondary' => $result['Participant']['_person2'] ?? null,
                        ];
                    }
                    return [null, null];
                };
            
                // Generate a line based on the result and noname flag
                $generateLine = function ($result, $tournamentType, $noname) use ($getParticipants) {
                    $participants = $getParticipants($result, $tournamentType);
                    $primary = $participants['primary'];
                    $secondary = $participants['secondary'];
            
                    $place = $result['Place'] ?? '';
                    $points = round(($result['Result']['_pointsDecimal'] ?? 0) * 100) / 100;
            
                    $primaryId = ($primary['_pid']['Number'] ?? 0) > 10000 ? '' : ($primary['_pid']['Number'] ?? '');
                    $secondaryId = $secondary && (($secondary['_pid']['Number'] ?? 0) <= 10000) ? $secondary['_pid']['Number'] : '';
            
                    if ($noname) {
                        return join(",", [
                            $place,
                            $points,
                            '', // Name is omitted when noname is true
                            $primaryId,
                            $secondaryId
                        ]);
                    } else {
                        $name = $tournamentType === 'individual'
                            ? ($primary['_lastName'] . ' ' . $primary['_firstName'])
                            : ($primary['_lastName'] . ' - ' . $secondary['_lastName']);
            
                        return join(",", [
                            $place,
                            $points,
                            $name,
                            $primaryId,
                            $secondaryId
                        ]);
                    }
                };
            
                // Process results
                $lines = array_map(function ($result) use ($tournamentType, $noname, $generateLine) {
                    return $generateLine($result, $tournamentType, $noname);
                }, $results);
            
                return join("\n", $lines);
            } elseif ($tournamentType === 'team') {
                $players = ["PID,TeamID,LastName,FirstName,Number,Club,,"];
                $rankings = [""];
                $teams = ["TeamID,TeamID,TeamName"];

                foreach ($results as $result) {
                    $teamId = $result['Participant']['Number'] ?? '';
                    $teamName = $result['Participant']['_name'] ?? '';

                    // Add team information
                    $teams[] = join(",", [$teamId, $teamId, $teamName]);

                    // Add player information
                    foreach ($result['Participant']['_people'] as $key => $person) {
                        if ($person['_lastName'] !== '--NEW--') {
                            $players[] = join(",", [
                                $key,
                                $teamId,
                                $person['_lastName'] ?? '',
                                $person['_firstName'] ?? '',
                                ($person['_pid']['Number'] ?? 0) > 10000 ? '' : $person['_pid']['Number'],
                                $person['_club'] ?? '',
                                1,
                                ''
                            ]);
                        }
                    }

                    // Add rankings information
                    $rankings[] = join(",", [
                        1,
                        $result['Place'] ?? '',
                        $result['Place'] ?? '',
                        $teamId,
                        0,
                        0,
                        $result['Result']['_pointsDecimal'] ?? 0,
                        1
                    ]);
                }

                $files['players.csv'] = join("\n", $players);
                $files['rankings.csv'] = join("\n", $rankings);
                $files['teams.csv'] = join("\n", $teams);

                return $files; // Return files for team tournaments
            }
        } catch (Exception $e) {
            return "Error: " . $e->getMessage(); // Return error as string
        }
    }

    $output = fetchAndProcessResults($url, $noname, $tournamentType);

    if (is_array($output)) { // Team tournament
        // Render buttons for downloading files
        $downloadLinks = $output;
    } else {
        $downloadLinks = null;
    }
} else {
    $output = null;
    $downloadLinks = null;
    $noname = false;
    $tournamentType = 'pair';
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>matrikacbs.cz convertor</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 20px auto;
            padding: 0 20px;
        }
        .error {
            color: red;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
        }
        input[type="text"],
        input[type="number"],
        select {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
        }
        input[type="checkbox"] {
            margin-right: 5px;
        }
        input[type="submit"], button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        input[type="submit"]:hover, button:hover {
            background-color: #45a049;
        }
        textarea {
            width: 100%;
            font-family: monospace;
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            margin-top: 15px;
            margin-bottom: 15px;
            box-sizing: border-box;
        }
        .button-group {
            margin-top: 10px;
            display: flex;
            gap: 10px;
        }
        .intro {
            margin-bottom: 25px;
            line-height: 1.5;
            color: #444;
        }
        .flex {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .flex label {
            margin-bottom: 0;
        }
        .radio-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .radio-group label {
            margin-bottom: .5em;
            margin-top: .5em;
            margin-right: 1em;
        }
    </style>
    <link rel="stylesheet" href="/apps/guide.css">
</head>
<body>
    <p class="app-home"><a href="/">← bridge.zdenektomis.eu</a></p>
    <h1>Convert TournamentCalculator to <a href="https://matrikacbs.cz">matrikacbs.cz</a></h1>
    <div class="intro">
        This tool converts Tournament Calculator results to the import format for <a href="https://matrikacbs.cz">matrikacbs.cz</a>.<br>
        Enter the URL of the Tournament Calculator results, select the tournament type, and choose whether to exclude participant names. The output can be copied or downloaded for direct import.
    </div>
    <details class="app-guide">
        <summary><span data-lang="cs">Návod</span><span data-lang="en">How to use</span></summary>
        <span class="app-guide-lang"><button type="button" value="cs">CS</button><button type="button" value="en">EN</button></span>
        <div data-lang="cs">
            <p>Turnaj musí mít webovou prezentaci z Tournament Calculatoru. Do pole <em>Tournament URL</em> vložte její adresu.</p>
            <h3>Párové a individuální turnaje</h3>
            <p>Výstupem je csv soubor, jeden řádek na pár nebo hráče:</p>
            <p><code>umístění, výsledek, název, id hráčů ...</code></p>
            <ul>
                <li><code>umístění</code>: pořadí v turnaji. Při dělených místech se uvádí nejvyšší, např. 1, 1, 3 pro 1.–2. a 3. místo.</li>
                <li><code>výsledek</code>: libovolný text.</li>
                <li><code>název</code>: jména hráčů. Pokud mají všichni hráči číslo z Matriky, zaškrtněte <em>Exclude participant names</em> a název se vynechá.</li>
                <li><code>id hráčů</code>: čísla hráčů z Matriky. Hráči s číslem nad 10000 (dočasná čísla v TC) zůstanou bez čísla.</li>
            </ul>
            <p>Matrika přijímá „české csv“, tedy s oddělovačem středníkem a v kódování Windows-1250.</p>
            <h3>Týmové turnaje</h3>
            <p>Výstupem jsou tři soubory ke stažení: <code>players.csv</code>, <code>rankings.csv</code> a <code>teams.csv</code>.</p>
        </div>
        <div data-lang="en">
            <p>The tournament needs a Tournament Calculator web presentation. Paste its address into <em>Tournament URL</em>.</p>
            <h3>Pair and individual tournaments</h3>
            <p>The output is a csv file with one line per pair or player:</p>
            <p><code>place, result, name, player ids ...</code></p>
            <ul>
                <li><code>place</code>: final ranking. Shared places use the highest one, e.g. 1, 1, 3 for 1st–2nd and 3rd.</li>
                <li><code>result</code>: any text.</li>
                <li><code>name</code>: player names. If every player has a Matrika number, tick <em>Exclude participant names</em> to leave the name out.</li>
                <li><code>player ids</code>: Matrika numbers. Players numbered above 10000 (temporary numbers in TC) are left without a number.</li>
            </ul>
            <p>Matrika accepts “Czech csv”: semicolon as separator and Windows-1250 encoding.</p>
            <h3>Team tournaments</h3>
            <p>The output is three files to download: <code>players.csv</code>, <code>rankings.csv</code> and <code>teams.csv</code>.</p>
        </div>
    </details>
    <form method="get">
        <div class="form-group">
            <label for="url">Tournament URL:</label>
            <input type="text" id="url" name="url" value="<?= htmlspecialchars($_GET['url'] ?? '') ?>" required>
        </div>
        <div class="form-group">
            <label for="type">Tournament Type:</label>
            <div class="radio-group">
                <input type="radio" id="type-pair" name="type" value="pair" <?= $tournamentType === 'pair' ? 'checked' : '' ?>>
                <label for="type-pair">Pair Tournament</label>
                
                <input type="radio" id="type-individual" name="type" value="individual" <?= $tournamentType === 'individual' ? 'checked' : '' ?>>
                <label for="type-individual">Individual Tournament</label>
                
                <input type="radio" id="type-team" name="type" value="team" <?= $tournamentType === 'team' ? 'checked' : '' ?>>
                <label for="type-team">Team Tournament</label>
            </div>
        </div>
        <div class="form-group flex">
            <input type="checkbox" id="noname" name="noname" <?= $noname ? 'checked' : '' ?>>
            <label for="noname">Exclude participant names (use when all players have matrika numbers assigned and filled in)</label>
        </div>
        <div class="form-group">
            <input type="submit" value="Convert">
        </div>
    </form>

    <?php if ($output !== null && !is_array($output)): ?>
        <h2><?= strpos($output, "Error") === 0 ? "Error" : "Output" ?></h2>
        <textarea readonly rows="25"><?= htmlspecialchars($output) ?></textarea>
    <?php elseif (is_array($downloadLinks)): ?>
        <h2>Download Team Tournament Files</h2>
        <div class="button-group">
        <?php foreach ($downloadLinks as $fileName => $content): ?>
            <form method="post" action="download" style="display:inline;">
                <input type="hidden" name="filename" value="<?= htmlspecialchars($fileName) ?>">
                <input type="hidden" name="content" value="<?= htmlspecialchars(base64_encode($content)) ?>">
                <button type="submit">Download <?= htmlspecialchars($fileName) ?></button>
            </form>
        <?php endforeach; ?>
        </div>
    <?php endif; ?>
    <script src="/apps/guide.js"></script>
</body>
</html>
