<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['filename'], $_POST['content'])) {
    $filename = basename($_POST['filename']); // Ensure the filename is safe
    $content = base64_decode($_POST['content']); // Decode the content

    if ($content === false) {
        echo "Error: Invalid content data.";
        exit;
    }

    header('Content-Type: text/csv; charset=Windows-1250');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    echo $content;
    exit;
} else {
    echo "Error: Invalid request.";
}
