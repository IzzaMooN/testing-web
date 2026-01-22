<?php
// Tambahkan ini di paling atas untuk error handling yang lebih baik
error_reporting(0); // Matikan error reporting untuk produksi
ini_set('display_errors', 0);

require_once '../../../utility/config/dbbridgekey.php';

class TemplateManager {
    private $conn;
    
    public function __construct() {
        $this->conn = koneksiQiDB();
    }
    
    // Buat template baru
    public function createTemplate($username, $templateName, $description, $tags) {
        try {
            $this->conn->beginTransaction();
            
            // Insert template - SESUAIKAN DENGAN NAMA KOLOM HURUF KECIL
            $templateStmt = $this->conn->prepare('
                INSERT INTO trendtemplates (templatename, description, username, createdat, updatedat) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            ');
            $templateStmt->execute([$templateName, $description, $username]);
            $templateId = $templateStmt->fetch(PDO::FETCH_ASSOC)['id'];
            
            // Insert tags - SESUAIKAN DENGAN NAMA KOLOM HURUF KECIL
            $tagStmt = $this->conn->prepare('
                INSERT INTO trendtemplatetags (templateid, tagname, displayorder, createdat) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ');
            
            $order = 0;
            foreach ($tags as $tag) {
                $tagStmt->execute([$templateId, $tag, $order++]);
            }
            
            $this->conn->commit();
            return [
                'success' => true,
                'message' => 'Template berhasil dibuat',
                'template_id' => $templateId,
                'saved_tags' => count($tags)
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error membuat template: ' . $e->getMessage()
            ];
        }
    }
    
    // Update template
    public function updateTemplate($templateId, $templateName, $description, $tags) {
        try {
            $this->conn->beginTransaction();
            
            // Update template info - SESUAIKAN DENGAN NAMA KOLOM HURUF KECIL
            $templateStmt = $this->conn->prepare('
                UPDATE trendtemplates 
                SET templatename = ?, description = ?, updatedat = CURRENT_TIMESTAMP
                WHERE id = ?
            ');
            $templateStmt->execute([$templateName, $description, $templateId]);
            
            // Hapus tags lama
            $deleteStmt = $this->conn->prepare('
                DELETE FROM trendtemplatetags WHERE templateid = ?
            ');
            $deleteStmt->execute([$templateId]);
            
            // Insert tags baru
            $tagStmt = $this->conn->prepare('
                INSERT INTO trendtemplatetags (templateid, tagname, displayorder, createdat) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ');
            
            $order = 0;
            foreach ($tags as $tag) {
                $tagStmt->execute([$templateId, $tag, $order++]);
            }
            
            $this->conn->commit();
            return [
                'success' => true,
                'message' => 'Template berhasil diupdate',
                'updated_tags' => count($tags)
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error mengupdate template: ' . $e->getMessage()
            ];
        }
    }
    
    // Hapus template
    public function deleteTemplate($templateId, $username) {
        try {
            // DEBUG: Tambahkan logging
            error_log("DELETE TEMPLATE CALLED - templateId: $templateId, username: $username");
            
            // PERBAIKAN: Pastikan template milik user yang sesuai
            $checkStmt = $this->conn->prepare('
                SELECT id FROM trendtemplates 
                WHERE id = ? AND username = ?
            ');
            $checkStmt->execute([$templateId, $username]);
            
            $templateExists = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$templateExists) {
                error_log("Template $templateId not found or doesn't belong to user $username");
                return [
                    'success' => false,
                    'message' => 'Template tidak ditemukan atau tidak memiliki akses'
                ];
            }
            
            // Hapus tags terlebih dahulu (foreign key constraint)
            $deleteTagsStmt = $this->conn->prepare('
                DELETE FROM trendtemplatetags WHERE templateid = ?
            ');
            $deleteTagsStmt->execute([$templateId]);
            
            // Hapus template
            $stmt = $this->conn->prepare('
                DELETE FROM trendtemplates WHERE id = ?
            ');
            $stmt->execute([$templateId]);
            
            $rowCount = $stmt->rowCount();
            
            error_log("DELETE TEMPLATE RESULT - Rows affected: $rowCount");
            
            if ($rowCount > 0) {
                return [
                    'success' => true,
                    'message' => 'Template berhasil dihapus',
                    'rows_affected' => $rowCount
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Template gagal dihapus (mungkin sudah dihapus)',
                    'rows_affected' => $rowCount
                ];
            }
            
        } catch (Exception $e) {
            error_log("DELETE TEMPLATE ERROR: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error menghapus template: ' . $e->getMessage()
            ];
        }
    }
    
    // Ambil semua template milik user - PERBAIKI NAMA KOLOM
    public function getUserTemplates($username) {
        try {
            $stmt = $this->conn->prepare('
                SELECT 
                    tt.id,
                    tt.templatename,
                    tt.description,
                    tt.createdat,
                    tt.updatedat,
                    COUNT(ttt.id) as tagcount
                FROM trendtemplates tt
                LEFT JOIN trendtemplatetags ttt ON tt.id = ttt.templateid
                WHERE tt.username = ?
                GROUP BY tt.id, tt.templatename, tt.description, tt.createdat, tt.updatedat
                ORDER BY tt.updatedat DESC
            ');
            $stmt->execute([$username]);
            
            $templates = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $templates[] = [
                    'id' => $row['id'],
                    'template_name' => $row['templatename'], // HURUF KECIL
                    'description' => $row['description'], // HURUF KECIL
                    'tag_count' => $row['tagcount'], // HURUF KECIL
                    'created_at' => $row['createdat'], // HURUF KECIL
                    'updated_at' => $row['updatedat'] // HURUF KECIL
                ];
            }
            
            return [
                'success' => true,
                'templates' => $templates
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error mengambil templates: ' . $e->getMessage()
            ];
        }
    }
    
    // Ambil detail template termasuk tags - PERBAIKI NAMA KOLOM
    public function getTemplateDetail($templateId) {
        try {
            // Ambil info template
            $templateStmt = $this->conn->prepare('
                SELECT * FROM trendtemplates WHERE id = ?
            ');
            $templateStmt->execute([$templateId]);
            $template = $templateStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$template) {
                return [
                    'success' => false,
                    'message' => 'Template tidak ditemukan'
                ];
            }
            
            // Ambil tags
            $tagsStmt = $this->conn->prepare('
                SELECT tagname, displayorder 
                FROM trendtemplatetags 
                WHERE templateid = ? 
                ORDER BY displayorder ASC
            ');
            $tagsStmt->execute([$templateId]);
            
            $tags = [];
            while ($row = $tagsStmt->fetch(PDO::FETCH_ASSOC)) {
                $tags[] = $row['tagname']; // HURUF KECIL
            }
            
            return [
                'success' => true,
                'template' => [
                    'id' => $template['id'],
                    'template_name' => $template['templatename'], // HURUF KECIL
                    'description' => $template['description'], // HURUF KECIL
                    'username' => $template['username'], // HURUF KECIL
                    'created_at' => $template['createdat'], // HURUF KECIL
                    'updated_at' => $template['updatedat'], // HURUF KECIL
                    'tags' => $tags
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error mengambil detail template: ' . $e->getMessage()
            ];
        }
    }
}

// API Endpoint Handler
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// DEBUG: Log request method dan data
error_log("REQUEST METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("REQUEST GET: " . json_encode($_GET));
error_log("REQUEST POST: " . json_encode($_POST));
error_log("INPUT: " . file_get_contents('php://input'));

// Handle JSON parsing
$input = file_get_contents('php://input');
$data = [];

// PERBAIKAN: Jangan decode jika input kosong
if (!empty($input)) {
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        // Jika gagal decode JSON, coba dari POST
        $data = $_POST;
        error_log("JSON decode failed, using POST data instead");
    }
} else {
    // Jika tidak ada JSON, gunakan POST atau GET
    $data = !empty($_POST) ? $_POST : $_GET;
    error_log("No JSON input, using POST/GET data");
}

// DEBUG: Log processed data
error_log("PROCESSED DATA: " . json_encode($data));

$templateManager = new TemplateManager();

// PERBAIKAN: Ambil action dari data, bukan hanya dari GET
$action = $data['action'] ?? $_GET['action'] ?? '';
$username = $data['username'] ?? $_GET['username'] ?? '';
$templateId = $data['template_id'] ?? $_GET['template_id'] ?? $data['id'] ?? $_GET['id'] ?? 0;

error_log("ACTION: $action, USERNAME: $username, TEMPLATE_ID: $templateId");

// Validasi username untuk semua action kecuali list (jika tidak ada username)
if (empty($username) && !in_array($action, ['list'])) {
    echo json_encode(['success' => false, 'message' => 'Username harus diisi']);
    exit;
}

try {
    switch ($action) {
        case 'create':
            $templateName = $data['template_name'] ?? '';
            $description = $data['description'] ?? '';
            $tags = $data['tags'] ?? [];
            
            if (empty($templateName)) {
                echo json_encode(['success' => false, 'message' => 'Nama template harus diisi']);
                exit;
            }
            
            $result = $templateManager->createTemplate($username, $templateName, $description, $tags);
            echo json_encode($result);
            break;
            
        case 'update':
            $templateId = $data['template_id'] ?? 0;
            $templateName = $data['template_name'] ?? '';
            $description = $data['description'] ?? '';
            $tags = $data['tags'] ?? [];
            
            if (empty($templateId)) {
                echo json_encode(['success' => false, 'message' => 'Template ID harus diisi']);
                exit;
            }
            
            $result = $templateManager->updateTemplate($templateId, $templateName, $description, $tags);
            echo json_encode($result);
            break;
            
        case 'delete':
            if (empty($templateId)) {
                echo json_encode(['success' => false, 'message' => 'Template ID harus diisi']);
                exit;
            }
            
            if (empty($username)) {
                echo json_encode(['success' => false, 'message' => 'Username harus diisi']);
                exit;
            }
            
            $result = $templateManager->deleteTemplate($templateId, $username);
            echo json_encode($result);
            break;
            
        case 'list':
            if (empty($username)) {
                echo json_encode(['success' => false, 'message' => 'Username harus diisi']);
                exit;
            }
            
            $result = $templateManager->getUserTemplates($username);
            echo json_encode($result);
            break;
            
        case 'detail':
            // PERBAIKAN: Tambahkan username untuk detail
            if (empty($templateId)) {
                echo json_encode(['success' => false, 'message' => 'Template ID harus diisi']);
                exit;
            }
            
            $result = $templateManager->getTemplateDetail($templateId);
            echo json_encode($result);
            break;
            
        default:
            error_log("INVALID ACTION: $action");
            echo json_encode(['success' => false, 'message' => 'Action tidak valid: ' . $action]);
    }
} catch (Exception $e) {
    error_log("SERVER ERROR: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>