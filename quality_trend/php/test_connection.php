<?php
// test_connection.php
require_once '../../../utility/config/dbbridgekey.php';

try {
    $conn = koneksiQiDB();
    
    // Test query sederhana
    $stmt = $conn->query("SELECT version()");
    $version = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Koneksi database berhasil',
        'postgres_version' => $version['version']
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Koneksi database gagal: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn = null;
    }
}
?>