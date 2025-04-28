<?php

/*
Download frequencies from a Tournament Calculator online presentation
Web interface version - in-memory processing
*/

function cleanUrl(string $url): string {
    // Remove fragment
    $url = preg_replace('/#.*$/', '', $url);
    // Remove query string
    $url = preg_replace('/\?.*$/', '', $url);
    // Remove trailing slashes
    return rtrim($url, '/');
}

function downloadAndProcessJson(string $url): array {
    try {
        $context = stream_context_create([
            'http' => [
                'ignore_errors' => true,
                'timeout' => 30
            ]
        ]);
        
        $content = file_get_contents($url, false, $context);
        if ($content === false) {
            throw new Exception("Failed to download data");
        }
        
        $data = json_decode($content, true);
        if ($data === null) {
            throw new Exception("Failed to parse JSON");
        }
        
        $scores = [];
        $boardNumber = $data['ScoringGroups'][0]['Distribution']['_numberAsPlayed'] ?? null;
        
        foreach ($data['ScoringGroups'][0]['Scores'] as $scoreEntry) {
            if (isset($scoreEntry['NsScore']['Score'])) {
                $scores[] = $scoreEntry['NsScore']['Score'];
            }
        }
        
        return [
            'scores' => $scores,
            'boardNumber' => $boardNumber
        ];
    } catch (Exception $e) {
        error_log("Error processing {$url}: " . $e->getMessage());
        return ['scores' => [], 'boardNumber' => null];
    }
}

function processBoard(int $boardNum, array $scores): string {
    if (empty($scores)) {
        return "Board {$boardNum}\nNo valid scores found";
    }
    
    // Count frequencies
    $frequencies = array_count_values($scores);
    // Sort by score in descending order
    krsort($frequencies);
    
    $result = ["Board {$boardNum}"];
    foreach ($frequencies as $score => $freq) {
        $result[] = "{$score} {$freq}";
    }
    
    return implode("\n", $result);
}

function calculateBoardStats(array $scores, $dropCount = 0, $dropPercentage = 0): array {
    if (empty($scores)) {
        return [
            'average' => null,
            'count' => 0,
            'included' => [],
            'excluded' => []
        ];
    }

    sort($scores); // Sort scores for easier dropping of extremes
    $totalScores = count($scores);
    
    // Calculate how many scores to drop from each end
    $dropFromEach = 0;
    if ($dropCount > 0) {
        $dropFromEach = min($dropCount, floor($totalScores / 2) - 1);
    } elseif ($dropPercentage > 0) {
        $dropFromEach = min(floor(($dropPercentage / 100 * $totalScores) ), floor($totalScores / 2) - 1);
    }

    // Slice the array to remove extreme scores
    $includedScores = array_slice($scores, $dropFromEach, $totalScores - (2 * $dropFromEach));
    $excludedLow = array_slice($scores, 0, $dropFromEach);
    $excludedHigh = array_slice(array_reverse($scores), 0, $dropFromEach);
    
    $average = count($includedScores) > 0 ? array_sum($includedScores) / count($includedScores) : null;
    
    return [
        'average' => $average,
        'count' => count($includedScores),
        'included' => $includedScores,
        'excluded' => array_merge($excludedLow, $excludedHigh)
    ];
}

function formatBoardStats(int $boardNum, array $scores, $dropCount = 0, $dropPercentage = 0): string {
    $stats = calculateBoardStats($scores, $dropCount, $dropPercentage);
    
    if ($stats['average'] === null) {
        return "Board {$boardNum}: No valid scores";
    }
    
    $result = ["Board {$boardNum}:"];

    
    $result[] = sprintf("Average: %.2f (%d scores included)", $stats['average'], $stats['count']);
    
    // Only show excluded scores if we're actually filtering
    if (($dropCount > 0 || $dropPercentage > 0) && !empty($stats['excluded'])) {
        $excluded = $stats['excluded'];
        sort($excluded);
        $result[] = sprintf("Excluded low scores: %s", implode(", ", array_slice($excluded, 0, count($excluded)/2)));
        $result[] = sprintf("Excluded high scores: %s", implode(", ", array_slice($excluded, count($excluded)/2)));
    }
    
    // For included scores, just sort them
    $included = $stats['included'];
    sort($included);
    $result[] = sprintf("Scores: %s", implode(", ", $included));
    
    return implode("\n", $result);
}

function formatSimpleAverage(int $boardNum, array $scores, $dropCount = 0, $dropPercentage = 0): string {
    $stats = calculateBoardStats($scores, $dropCount, $dropPercentage);
    if ($stats['average'] === null) {
        return "{$boardNum} N/A";
    }
    return sprintf("%d\t%d", $boardNum, round($stats['average']));
}

// If it's a download request
if (isset($_POST['download']) && !empty($_POST['results'])) {
    header('Content-Type: text/plain');
    header('Content-Disposition: attachment; filename="frequencies.txt"');
    echo $_POST['results'];
    exit;
}

// Initialize variables
$results = '';
$averages = '';
$error = '';
$baseUrl = '';
$startNum = '';
$endNum = '';
$dropCount = 0;
$dropPercentage = 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate and process form data
    $baseUrl = cleanUrl(trim($_POST['base_url'] ?? ''));
    $startNum = filter_input(INPUT_POST, 'start_num', FILTER_VALIDATE_INT);
    $endNum = filter_input(INPUT_POST, 'end_num', FILTER_VALIDATE_INT);
    $dropCount = filter_input(INPUT_POST, 'drop_count', FILTER_VALIDATE_INT) ?: 0;
    $dropPercentage = filter_input(INPUT_POST, 'drop_percentage', FILTER_VALIDATE_FLOAT) ?: 0;
    
    if (empty($baseUrl)) {
        $error = "Base URL is required";
    } elseif ($startNum === false || $startNum === null) {
        $error = "Invalid start number";
    } elseif ($endNum === false || $endNum === null) {
        $error = "Invalid end number";
    } elseif ($startNum > $endNum) {
        $error = "Start number must be less than or equal to end number";
    } elseif ($dropCount < 0) {
        $error = "Drop count cannot be negative";
    } elseif ($dropPercentage < 0 || $dropPercentage >= 100) {
        $error = "Drop percentage must be between 0 and 100";
    } else {
        // Process boards and collect results
        $resultLines = [];
        $averageLines = [];
        $simpleAverageLines = [];
        $allScores = [];
        
        for ($fileNum = $startNum; $fileNum <= $endNum; $fileNum++) {
            $url = $baseUrl . "/p{$fileNum}.json";
            $data = downloadAndProcessJson($url);
            
            if (!empty($data['scores'])) {
                $boardNum = $data['boardNumber'] ?? $fileNum;
                $allScores[$boardNum] = $data['scores'];
            }
        }
        
        // Sort results by actual board number
        ksort($allScores);
        $resultLines = [];
        $averageLines = [];
        $simpleAverageLines = [];
    
        if ($dropCount > 0) {
            $averageLines[] = sprintf("Dropping %d score(s) from each end", floor($dropCount));
        } elseif ($dropPercentage > 0) {
            $averageLines[] = sprintf("Dropping %.1f%% from each end", $dropPercentage);
        } else {
            $averageLines[] = "Using all scores";
        }

        foreach ($allScores as $boardNum => $scores) {
            $resultLines[] = processBoard($boardNum, $scores);
            $averageLines[] = formatBoardStats($boardNum, $scores, $dropCount, $dropPercentage);
            $simpleAverageLines[] = formatSimpleAverage($boardNum, $scores, $dropCount, $dropPercentage);
        }
        
        $results = implode("\n\n", $resultLines);
        $averageCalculations = implode("\n\n", $averageLines);
        $averages = implode("\n", $simpleAverageLines);
    }
}

// Output HTML
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tournament Calculator Frequencies</title>
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
        input[type="number"] {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
        }
        input[type="submit"] {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        input[type="submit"]:hover {
            background-color: #45a049;
        }
        pre {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        
        .button-group {
            margin-top: 10px;
            display: flex;
            gap: 10px;
        }
        
        .button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            font-size: 14px;
        }
        
        .button:hover {
            background-color: #45a049;
        }
        
        .button.secondary {
            background-color: #2196F3;
        }
        
        .button.secondary:hover {
            background-color: #1976D2;
        }
        
        textarea {
            width: 100%;
            font-family: monospace;
        }
        
        #copyStatus {
            color: #4CAF50;
            display: none;
            margin-left: 10px;
            font-size: 14px;
        }
        
        .round-selector {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .round-selector label {
            display: inline-block;
            margin-right: 15px;
        }
        
        .round-selector input[type="number"] {
            width: 80px;
            display: inline-block;
        }
        
        .round-selector button {
            margin-left: 10px;
        }
        
        .board-range {
            margin-top: 10px;
            color: #666;
            font-style: italic;
        }
        
        .results-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        
        .results-section {
            display: flex;
            flex-direction: column;
        }
        
        .results-section h3 {
            margin-top: 0;
        }
        
        .filter-options {
            margin-top: 15px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        
        .filter-options h4 {
            margin-top: 0;
            margin-bottom: 10px;
        }
        
        .filter-method {
            margin-bottom: 15px;
        }
        
        .filter-method label {
            margin-right: 20px;
            cursor: pointer;
        }
        
        .filter-inputs {
            margin-left: 20px;
        }
        
        .filter-inputs.hidden {
            display: none;
        }
        
        .filter-inputs label {
            display: inline-block;
            width: auto;
            margin-right: 10px;
        }
        
        .filter-inputs input[type="number"] {
            width: 80px;
            margin-right: 20px;
        }
        
        .intro {
            margin-bottom: 25px;
            line-height: 1.5;
            color: #444;
        }
    </style>
</head>
<body>
    <h1>Tournament Calculator Frequencies</h1>
    
    <div class="intro">
        This tool processes Tournament Calculator results to show frequencies and averages for each board. 
        Enter the base URL of the tournament presentation (where the JSON files are located), select the board range, 
        and optionally choose a filtering method for average calculations. The results will show both the raw frequencies 
        and board averages. For averages, you can choose to use all scores or drop extreme results either by count or percentage 
        from each end. The board numbers shown correspond to the actual tournament board numbers.
    </div>
    
    <?php if ($error): ?>
        <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    
    <form method="post" id="frequencyForm">
        
        <div class="round-selector">
            <div>
                <label for="boardsPerRound">Boards per round:</label>
                <input type="number" id="boardsPerRound" min="1" value="28">
                
                <label for="roundNumber">Round number:</label>
                <input type="number" id="roundNumber" min="1" value="1">
                
                <button type="button" class="button secondary" onclick="calculateBoards()">Set Range</button>
            </div>
            <div class="board-range" id="boardRange"></div>
        </div>

        <div class="form-group">
            <label for="base_url">Base URL:</label>
            <input type="text" id="base_url" name="base_url" value="<?= htmlspecialchars($baseUrl) ?>" 
                   placeholder="e.g., https://vysledky.bkpraha.cz/prezentace/2024/prazska-bridzova-liga/" required>
        </div>
        
        <div class="form-group">
            <label for="start_num">Start Number:</label>
            <input type="number" id="start_num" name="start_num" value="<?= htmlspecialchars($startNum) ?>" 
                   min="1" required>
        </div>
        
        <div class="form-group">
            <label for="end_num">End Number:</label>
            <input type="number" id="end_num" name="end_num" value="<?= htmlspecialchars($endNum) ?>" 
                   min="1" required>
        </div>
        
        <div class="filter-options">
            <h4>Average Calculation Filters:</h4>
            <div class="filter-method">
                <label>
                    <input type="radio" name="drop_method" value="none" 
                           <?= empty($dropCount) && empty($dropPercentage) ? 'checked' : '' ?>>
                    Use all scores
                </label>
                <label>
                    <input type="radio" name="drop_method" value="count" 
                           <?= !empty($dropCount) ? 'checked' : '' ?>>
                    Drop by count (from each end)
                </label>
                <label>
                    <input type="radio" name="drop_method" value="percentage" 
                           <?= !empty($dropPercentage) ? 'checked' : '' ?>>
                    Drop by percentage (from each end)
                </label>
            </div>
            <div id="countInputs" class="filter-inputs <?= empty($dropCount) ? 'hidden' : '' ?>">
                <label for="drop_count">Number of scores to drop from each end:</label>
                <input type="number" id="drop_count" name="drop_count" 
                       value="<?= htmlspecialchars($dropCount) ?>" 
                       min="0" step="1">
            </div>
            <div id="percentageInputs" class="filter-inputs <?= empty($dropPercentage) ? 'hidden' : '' ?>">
                <label for="drop_percentage">Percentage to drop from each end:</label>
                <input type="number" id="drop_percentage" name="drop_percentage" 
                       value="<?= htmlspecialchars($dropPercentage) ?>" 
                       min="0" max="49.9" step="0.1">%
            </div>
        </div>
        
        <div class="form-group">
            <input type="submit" value="Get Frequencies" class="button">
        </div>
    </form>
    
    <?php if ($results): ?>
        <div class="results-container">
            <div class="results-section">
                <h3>Frequencies:</h3>
                <textarea id="resultsText" rows="20" readonly><?= htmlspecialchars($results) ?></textarea>
                <div class="button-group">
                    <form method="post" style="display: inline;">
                        <input type="hidden" name="results" value="<?= htmlspecialchars($results) ?>">
                        <button type="submit" name="download" class="button">Download Frequencies</button>
                    </form>
                    <button onclick="copyToClipboard('resultsText')" class="button secondary">Copy Frequencies</button>
                </div>
            </div>
            
            <div class="results-section">
                <h3>Simple Averages:</h3>
                <textarea id="averagesText" rows="20" readonly><?= htmlspecialchars($averages) ?></textarea>
                <div class="button-group">
                    <form method="post" style="display: inline;">
                        <input type="hidden" name="results" value="<?= htmlspecialchars($averages) ?>">
                        <button type="submit" name="download" class="button">Download Averages</button>
                    </form>
                    <button onclick="copyToClipboard('averagesText')" class="button secondary">Copy Averages</button>
                </div>
            </div>
            <span id="copyStatus">Copied!</span>          
        </div>
        <div class="results-section">
                <h3>Average Calculations:</h3>
                <pre id="averageCalcText" rows="20" readonly><?= htmlspecialchars($averageCalculations) ?></pre>
                <div class="button-group">
                        <input type="hidden" name="results" value="<?= htmlspecialchars($averageCalculations) ?>">
                </div>
        </div>
    <?php endif; ?>

    <script>
        function calculateBoards() {
            const boardsPerRound = parseInt(document.getElementById('boardsPerRound').value) || 0;
            const roundNumber = parseInt(document.getElementById('roundNumber').value) || 0;
            
            if (boardsPerRound < 1 || roundNumber < 1) {
                alert('Please enter valid numbers for boards per round and round number');
                return;
            }
            
            const startBoard = ((roundNumber - 1) * boardsPerRound) + 1;
            const endBoard = roundNumber * boardsPerRound;
            
            // Update the form fields
            document.getElementById('start_num').value = startBoard;
            document.getElementById('end_num').value = endBoard;
            
            // Update the display text
            const rangeText = `Boards ${startBoard} to ${endBoard}`;
            document.getElementById('boardRange').textContent = rangeText;
        }

        function copyToClipboard(elementId) {
            const textarea = document.getElementById(elementId);
            const copyStatus = document.getElementById('copyStatus');
            
            textarea.select();
            try {
                document.execCommand('copy');
                copyStatus.style.display = 'inline';
                setTimeout(() => {
                    copyStatus.style.display = 'none';
                }, 2000);
            } catch (err) {
                alert('Failed to copy text. Please try again.');
            }
            
            window.getSelection().removeAllRanges();
        }

        // Handle radio button changes
        document.querySelectorAll('input[name="drop_method"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const countInputs = document.getElementById('countInputs');
                const percentageInputs = document.getElementById('percentageInputs');
                const dropCount = document.getElementById('drop_count');
                const dropPercentage = document.getElementById('drop_percentage');
                
                countInputs.classList.add('hidden');
                percentageInputs.classList.add('hidden');
                dropCount.value = '';
                dropPercentage.value = '';
                
                if (this.value === 'count') {
                    countInputs.classList.remove('hidden');
                    dropCount.focus();
                } else if (this.value === 'percentage') {
                    percentageInputs.classList.remove('hidden');
                    dropPercentage.focus();
                }
            });
        });

        // Form validation
        document.getElementById('frequencyForm').addEventListener('submit', function(e) {
            const method = document.querySelector('input[name="drop_method"]:checked').value;
            
            if (method === 'count' && !document.getElementById('drop_count').value) {
                e.preventDefault();
                alert('Please enter the number of scores to drop');
            } else if (method === 'percentage' && !document.getElementById('drop_percentage').value) {
                e.preventDefault();
                alert('Please enter the percentage of scores to drop');
            }
        });

        window.onload = function() {
            const startNum = document.getElementById('start_num').value;
            const endNum = document.getElementById('end_num').value;
            if (startNum && endNum) {
                const boardsPerRound = endNum - startNum + 1;
                const roundNumber = Math.floor((startNum - 1) / boardsPerRound) + 1;
                document.getElementById('boardsPerRound').value = boardsPerRound;
                document.getElementById('roundNumber').value = roundNumber;
                document.getElementById('boardRange').textContent = `Boards ${startNum} to ${endNum}`;
            }
        };
    </script>
</body>
</html>


 