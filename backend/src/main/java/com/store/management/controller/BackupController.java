package com.store.management.controller;

import com.store.management.service.BackupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/backup")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class BackupController {

    private final BackupService backupService;

    @PostMapping("/manual")
    public ResponseEntity<Map<String, String>> triggerManualBackup() {
        try {
            backupService.triggerManualBackup();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Manual backup triggered successfully");
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Manual backup failed", e);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Manual backup failed: " + e.getMessage());
            response.put("status", "error");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/gdrive")
    public ResponseEntity<Map<String, String>> triggerGoogleDriveBackup() {
        try {
            backupService.triggerGoogleDriveBackup();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Backup completed successfully (local backup created)");
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Google Drive backup failed", e);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Backup failed: " + e.getMessage());
            response.put("status", "error");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getBackupStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("automatedBackupEnabled", true);
        status.put("backupInterval", "1 hour");
        status.put("lastBackup", "Will be available after first backup");
        status.put("nextBackup", "Scheduled every hour");
        return ResponseEntity.ok(status);
    }
} 