<?php
// get_tagnames.php
require_once '../../../utility/config/dbbridgekey.php';

try {
    $conn = koneksiQiDB();
    
    // Query untuk mengambil semua tagname, description, plant, dan limits
    $sql = "SELECT tagname, description, plant, format, lsl, usl, lgl, ugl
            FROM tagnamelist 
            ORDER BY plant, tagname";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    
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
            'message' => 'Data tag tidak ditemukan'
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