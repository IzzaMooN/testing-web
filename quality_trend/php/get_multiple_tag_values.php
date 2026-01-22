<?php
// get_multiple_tag_values.php - PERBAIKAN DENGAN DEBUG EKSTENSIF
require_once '../../../utility/config/dbbridgekey.php';

// DEBUG: Enable full error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

// Function untuk log debug
function debug_log($message, $data = null) {
    $log_entry = date('Y-m-d H:i:s') . " - " . $message;
    if ($data !== null) {
        $log_entry .= " - " . json_encode($data, JSON_UNESCAPED_UNICODE);
    }
    error_log($log_entry);
    
    // Juga simpan ke array untuk dikembalikan di response
    global $debug_info;
    $debug_info[] = $message . ($data ? ": " . json_encode($data) : "");
}

$debug_info = [];

// Ambil parameter
$tagnames = '';
$start_date = '';
$end_date = '';

debug_log("=== START get_multiple_tag_values.php ===");

// Cek metode request
debug_log("Request method", $_SERVER['REQUEST_METHOD']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $tagnames = isset($_GET['tagnames']) ? $_GET['tagnames'] : '';
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : '';
    
    debug_log("GET Parameters", $_GET);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Cek POST form data
    if (!empty($_POST)) {
        $tagnames = isset($_POST['tagnames']) ? $_POST['tagnames'] : '';
        $start_date = isset($_POST['start_date']) ? $_POST['start_date'] : '';
        $end_date = isset($_POST['end_date']) ? $_POST['end_date'] : '';
        
        debug_log("POST form data", $_POST);
    }
    
    // Cek JSON input
    $rawInput = file_get_contents('php://input');
    debug_log("Raw input", $rawInput);
    
    if (!empty($rawInput)) {
        $postData = json_decode($rawInput, true);
        debug_log("Parsed JSON", $postData);
        
        if (is_array($postData)) {
            if (isset($postData['tagnames'])) {
                $tagnames = $postData['tagnames'];
            }
            if (isset($postData['start_date'])) {
                $start_date = $postData['start_date'];
            }
            if (isset($postData['end_date'])) {
                $end_date = $postData['end_date'];
            }
        }
    }
}

debug_log("Final parameters", [
    'tagnames' => $tagnames,
    'start_date' => $start_date,
    'end_date' => $end_date
]);

// Validasi parameter
if (empty($tagnames)) {
    $response = [
        'success' => false,
        'message' => 'Parameter tagnames diperlukan',
        'debug' => $debug_info
    ];
    
    debug_log("ERROR: tagnames empty", $response);
    echo json_encode($response);
    exit;
}

// Convert tagnames to array
$tagnameArray = explode(',', $tagnames);
$tagnameArray = array_map('trim', $tagnameArray);
$tagnameArray = array_filter($tagnameArray);

debug_log("Tagname array", $tagnameArray);

if (empty($tagnameArray)) {
    $response = [
        'success' => false,
        'message' => 'Tidak ada tag yang valid',
        'debug' => $debug_info
    ];
    
    debug_log("ERROR: empty tagname array", $response);
    echo json_encode($response);
    exit;
}

// Validasi dan format tanggal
if (empty($start_date) || empty($end_date)) {
    $end_date = date('Y-m-d');
    $start_date = date('Y-m-d', strtotime('-7 days'));
    debug_log("Using default dates", ['start' => $start_date, 'end' => $end_date]);
}

try {
    $conn = koneksiQiDB();
    
    if (!$conn) {
        throw new Exception("Koneksi database gagal");
    }
    
    debug_log("Database connected successfully");
    
    // 1. Cek apakah tags ada di tagnamelist
    $placeholders = implode(',', array_fill(0, count($tagnameArray), '?'));
    $checkSql = "SELECT tagname FROM tagnamelist WHERE tagname IN ($placeholders)";
    
    debug_log("Check SQL", $checkSql);
    debug_log("Check params", $tagnameArray);
    
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->execute($tagnameArray);
    $existingTags = $checkStmt->fetchAll(PDO::FETCH_COLUMN, 0);
    
    debug_log("Tags found in tagnamelist", $existingTags);
    debug_log("Tags NOT found", array_diff($tagnameArray, $existingTags));
    
    // 2. Query data dari masterqualitydata
    // PERBAIKAN: Gunakan BETWEEN untuk inclusive date range
    $sql = "SELECT 
                datetime, 
                tagname, 
                value,
                EXTRACT(EPOCH FROM datetime) as timestamp
            FROM masterqualitydata 
            WHERE tagname IN ($placeholders) 
            AND datetime::date BETWEEN ? AND ?
            ORDER BY tagname, datetime";
    
    $params = $tagnameArray;
    $params[] = $start_date;
    $params[] = $end_date;
    
    debug_log("Main SQL", $sql);
    debug_log("Main params", $params);
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    debug_log("Query result count", count($result));
    debug_log("Sample rows", array_slice($result, 0, 3));
    
    if (!empty($result)) {
        // Group data by tagname
        $groupedData = [];
        foreach ($result as $row) {
            $tagname = $row['tagname'];
            if (!isset($groupedData[$tagname])) {
                $groupedData[$tagname] = [];
            }
            
            $groupedData[$tagname][] = [
                'datetime' => $row['datetime'],
                'value' => (float)$row['value'],
                'timestamp' => (int)$row['timestamp']
            ];
        }
        
        debug_log("Grouped data keys", array_keys($groupedData));
        
        // Pastikan semua tag yang diminta ada di response (walaupun kosong)
        foreach ($tagnameArray as $tag) {
            if (!isset($groupedData[$tag])) {
                $groupedData[$tag] = [];
                debug_log("Tag $tag has no data, adding empty array");
            }
        }
        
        $response = [
            'success' => true,
            'data' => $groupedData,
            'count' => count($result),
            'message' => 'Data berhasil diambil',
            'debug' => [
                'info' => $debug_info,
                'requested_tags' => $tagnameArray,
                'found_tags' => array_keys($groupedData),
                'tags_with_data' => array_filter(array_keys($groupedData), function($tag) use ($groupedData) {
                    return !empty($groupedData[$tag]);
                }),
                'tags_without_data' => array_filter(array_keys($groupedData), function($tag) use ($groupedData) {
                    return empty($groupedData[$tag]);
                }),
                'date_range' => ['start' => $start_date, 'end' => $end_date]
            ]
        ];
        
        debug_log("SUCCESS response prepared");
        
    } else {
        // Coba query tanpa filter tanggal dulu untuk debugging
        $noDateSql = "SELECT datetime, tagname, value FROM masterqualitydata 
                     WHERE tagname IN ($placeholders) 
                     LIMIT 5";
        
        $noDateStmt = $conn->prepare($noDateSql);
        $noDateStmt->execute($tagnameArray);
        $noDateResult = $noDateStmt->fetchAll(PDO::FETCH_ASSOC);
        
        debug_log("Query tanpa tanggal result", $noDateResult);
        
        $response = [
            'success' => false,
            'message' => 'Data tidak ditemukan untuk tags yang diminta',
            'data' => [], // Tetap kirim array kosong untuk consistency
            'debug' => [
                'info' => $debug_info,
                'requested_tags' => $tagnameArray,
                'tags_in_tagnamelist' => $existingTags,
                'sample_data_no_date' => $noDateResult,
                'date_range' => ['start' => $start_date, 'end' => $end_date],
                'sql' => $sql,
                'params' => $params
            ]
        ];
        
        debug_log("NO DATA response");
    }
    
} catch (PDOException $e) {
    debug_log("Database PDOException", $e->getMessage());
    
    $response = [
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'debug' => $debug_info
    ];
} catch (Exception $e) {
    debug_log("General Exception", $e->getMessage());
    
    $response = [
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'debug' => $debug_info
    ];
} finally {
    if (isset($conn)) {
        $conn = null;
    }
}

// Tambahkan timestamp dan final debug info
$response['timestamp'] = date('Y-m-d H:i:s');
$response['debug']['full_log'] = $debug_info;

debug_log("Final response", $response);

// Di bagian akhir file sebelum echo json_encode
if (empty($groupedData)) {
    // Jika tidak ada data, kembalikan object kosong untuk setiap tag
    $groupedData = [];
    foreach ($tagnameArray as $tag) {
        $groupedData[$tag] = [];
    }
    
    $response = [
        'success' => true, // PERBAIKAN: Ubah jadi true meski data kosong
        'data' => $groupedData,
        'count' => 0,
        'message' => 'Data ditemukan (kosong)',
        'debug' => [
            'info' => $debug_info,
            'requested_tags' => $tagnameArray,
            'date_range' => ['start' => $start_date, 'end' => $end_date]
        ]
    ];
    
    debug_log("SUCCESS but empty data");
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>