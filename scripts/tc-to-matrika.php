<?php
/**
 * Convert Tournament Calculator results to matrikacbs.cz import format
 */

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['url'])) {
    $url = preg_replace('/#.*$/', '', $_GET['url']); // Remove fragment from URL
    $noname = isset($_GET['noname']);
    $tournamentType = $_GET['type'] ?? 'pair';

    function fetchAndProcessResults($url, $noname = false, $tournamentType = 'pair') {
        // Ensure the URL ends with 'results.json'
        $url = rtrim($url, '/');
        if (!preg_match('/results\.json$/', $url)) {
            $url .= '/results.json';
        }

        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new Exception("Invalid URL provided.");
        }

        try {
            $jsonData = file_get_contents($url);
            if ($jsonData === false) {
                throw new Exception("Failed to fetch data from URL: $url");
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
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>matrikacbs.cz convertor</title>
    <link rel="stylesheet" href="https://unpkg.com/bamboo.css">
</head>
<body>
    <h1>Convert TournamentCalculator to <a href="https://matrikacbs.cz">matrikacbs.cz</a></h1>
    <form method="get">
        <label for="url">Tournament URL:</label>
        <input type="text" id="url" name="url" value="<?= htmlspecialchars($_GET['url'] ?? '') ?>" required>
        <br>
        <label for="type">Tournament Type:</label>
        <select id="type" name="type">
            <option value="pair" <?= $tournamentType === 'pair' ? 'selected' : '' ?>>Pair Tournament</option>
            <option value="individual" <?= $tournamentType === 'individual' ? 'selected' : '' ?>>Individual Tournament</option>
            <option value="team" <?= $tournamentType === 'team' ? 'selected' : '' ?>>Team Tournament</option>
        </select>
        <br>
        <input type="checkbox" id="noname" name="noname" <?= $noname ? 'checked' : '' ?>>
        <label for="noname">Exclude participant names (use when all players have matrika numbers assigned and filled in)</label>
        <br>
        <button type="submit">Convert</button>
    </form>

    <?php if ($output !== null && !is_array($output)): ?>
        <h2><?= strpos($output, "Error") === 0 ? "Error" : "Output" ?></h2>
        <textarea readonly rows="25"><?= htmlspecialchars($output) ?></textarea>
    <?php elseif (is_array($downloadLinks)): ?>
        <h2>Download Team Tournament Files</h2>
        <?php foreach ($downloadLinks as $fileName => $content): ?>
            <form method="post" action="download" style="display:inline;">
                <input type="hidden" name="filename" value="<?= htmlspecialchars($fileName) ?>">
                <input type="hidden" name="content" value="<?= htmlspecialchars(base64_encode($content)) ?>">
                <button type="submit">Download <?= htmlspecialchars($fileName) ?></button>
            </form>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>
