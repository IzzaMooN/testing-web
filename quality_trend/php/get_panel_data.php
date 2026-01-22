<?php
// get_panel_data.php - VERSI FIXED
require_once '../../../utility/config/dbbridgekey.php';

// Ambil parameter dari request
$plant = isset($_GET['plant']) ? $_GET['plant'] : '';
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : '';

// Validasi parameter
if (empty($plant)) {
    echo json_encode([
        'success' => false,
        'message' => 'Parameter plant diperlukan'
    ]);
    exit;
}

try {
    $conn = koneksiQiDB();
    
    // 1. Ambil daftar tag untuk plant yang diminta
    $tagSql = "SELECT tagname, description, lsl, usl 
               FROM tagnamelist 
               WHERE plant = :plant 
               ORDER BY tagname";
    
    $tagStmt = $conn->prepare($tagSql);
    $tagStmt->execute([':plant' => $plant]);
    $tags = $tagStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($tags)) {
        echo json_encode([
            'success' => false,
            'message' => 'Tidak ada tag ditemukan untuk plant: ' . $plant
        ]);
        exit;
    }
    
    // 2. Ambil data untuk setiap tag dan format sebagai array
    $tagsArray = [];
    
    foreach ($tags as $tag) {
        $sql = "SELECT datetime, value 
                FROM masterqualitydata 
                WHERE tagname = :tagname";
        
        $params = [':tagname' => $tag['tagname']];
        
        // Tambahkan filter tanggal jika provided
        if (!empty($start_date) && !empty($end_date)) {
            $sql .= " AND datetime >= :start_date AND datetime <= :end_date";
            $params[':start_date'] = $start_date . ' 00:00:00';
            $params[':end_date'] = $end_date . ' 23:59:59';
        }
        
        $sql .= " ORDER BY datetime";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format sebagai array (bukan object)
        $tagsArray[] = [
            'tagname' => $tag['tagname'],
            'description' => $tag['description'],
            'lsl' => $tag['lsl'] !== null ? (float)$tag['lsl'] : null,
            'usl' => $tag['usl'] !== null ? (float)$tag['usl'] : null,
            'data' => $data
        ];
    }
    
    echo json_encode([
        'success' => true,
        'plant' => $plant,
        'tags' => $tagsArray,  // ← PASTIKAN INI ARRAY
        'tag_count' => count($tagsArray)
    ]);
    
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