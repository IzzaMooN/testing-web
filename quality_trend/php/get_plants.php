<?php
// get_plants.php - Ambil daftar plant yang ada di database
require_once '../../../utility/config/dbbridgekey.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

try {
    $conn = koneksiQiDB();
    
    // Debug: Cek koneksi
    if (!$conn) {
        throw new Exception('Koneksi database gagal');
    }
    
    // Query untuk mengambil daftar plant unik dengan filter yang lebih ketat
    $sql = "SELECT DISTINCT plant FROM tagnamelist 
            WHERE plant IS NOT NULL 
            AND plant != ''
            AND TRIM(plant) != ''
            AND LOWER(plant) NOT IN ('null', 'none', 'na', 'n/a')
            ORDER BY plant";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $plants = [];
    foreach ($result as $row) {
        $plant = trim($row['plant']);
        if (!empty($plant)) {
            $plants[] = $plant;
        }
    }
    
    // Debug: Log hasil query
    error_log("Plants query result count: " . count($plants));
    error_log("Plants found: " . implode(', ', $plants));
    
    if (count($plants) > 0) {
        echo json_encode([
            'success' => true,
            'plants' => $plants,
            'count' => count($plants)
        ]);
    } else {
        // Coba query alternatif jika tidak ada data
        echo json_encode([
            'success' => false,
            'message' => 'Tidak ada plant ditemukan di database',
            'debug_info' => [
                'total_rows' => count($result),
                'raw_result' => $result
            ]
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database Error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
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