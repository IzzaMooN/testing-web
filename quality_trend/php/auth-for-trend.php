
<?php
require_once '../../../utility/config/dbbridgekey.php'; // Pastikan path benar

class AuthForTrend {
    private $conn;
    
    public function __construct() {
        $this->conn = koneksiQiDB();
    }
    
    public function checkSession() {
        // GUNAKAN SESSION YANG SAMA dengan home system
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Cek session dari sistem utama
        if (isset($_SESSION['user'])) {
            return [
                'success' => true,
                'user' => $_SESSION['user']
            ];
        }
        
        return [
            'success' => false,
            'message' => 'User belum login'
        ];
    }
}

// API Endpoint Handler
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$auth = new AuthForTrend();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'check_session':
        $result = $auth->checkSession();
        echo json_encode($result);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Action tidak valid']);
}
?>