<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['filename'], $_POST['content'])) {
    $filename = basename($_POST['filename']); // Ensure the filename is safe
    $content = base64_decode($_POST['content']); // Decode the content

    if ($content === false) {
        echo "Error: Invalid content data.";
        exit;
    }

    // Convert content to Windows-1250 encoding
    $contentInWin1250 = iconv('UTF-8', 'Windows-1250//TRANSLIT', $content);

    if ($contentInWin1250 === false) {
        echo "Error: Encoding conversion failed.";
        exit;
    }

    header('Content-Type: text/csv; charset=Windows-1250');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    echo $contentInWin1250;
    exit;
} else {
    echo "Error: Invalid request.";
}
