<?php
// get_tag_values.php
require_once '../../../utility/config/dbbridgekey.php';

// Ambil parameter dari request
$tagname = isset($_GET['tagname']) ? $_GET['tagname'] : '';
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : '';

// Validasi parameter
if (empty($tagname)) {
    echo json_encode([
        'success' => false,
        'message' => 'Parameter tagname diperlukan'
    ]);
    exit;
}

try {
    $conn = koneksiQiDB();
    
    // Bangun query berdasarkan parameter
    $sql = "SELECT datetime, tagname, value 
            FROM masterqualitydata 
            WHERE tagname = :tagname";
    
    $params = [':tagname' => $tagname];
    
    // Tambahkan filter tanggal jika provided
    if (!empty($start_date) && !empty($end_date)) {
        $sql .= " AND datetime >= :start_date AND datetime <= :end_date";
        $params[':start_date'] = $start_date;
        $params[':end_date'] = $end_date;
    }
    
    $sql .= " ORDER BY datetime";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'data' => $result,
            'count' => count($result)
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Data tidak ditemukan untuk tagname: ' . $tagname
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn = null;
    }
}
?>