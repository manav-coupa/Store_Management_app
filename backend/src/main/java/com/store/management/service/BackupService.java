package com.store.management.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.FileContent;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.store.management.dto.CustomerDTO;
import com.store.management.dto.TransactionDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BackupService {

    private final CustomerService customerService;
    private final TransactionService transactionService;
    private final ObjectMapper objectMapper;

    @Value("${backup.enabled:false}")
    private boolean backupEnabled;

    @Value("${google.drive.credentials.path:}")
    private String credentialsPath;

    @Value("${google.drive.folder.id:}")
    private String folderId;

    private Drive driveService;

    private static final String BACKUP_FILE_NAME = "store_management_backup.json";

    public void initializeGoogleDrive() {
        if (!backupEnabled || credentialsPath.isEmpty()) {
            log.info("Backup service is disabled or credentials not configured");
            return;
        }

        log.info("Google Drive initialization deferred until first use");
    }

    private void initializeGoogleDriveIfNeeded() {
        if (driveService != null) {
            return; // Already initialized
        }

        if (!backupEnabled || credentialsPath.isEmpty()) {
            log.info("Backup service is disabled or credentials not configured");
            return;
        }

        try {
            log.info("Initializing Google Drive OAuth 2.0 flow...");
            log.info("A browser window will open for authorization. Please authorize the application.");
            
            // Load OAuth 2.0 client secrets
            GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
                    GsonFactory.getDefaultInstance(),
                    new InputStreamReader(Files.newInputStream(Paths.get(credentialsPath)))
            );

            // Set up authorization code flow
            GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    clientSecrets,
                    List.of(DriveScopes.DRIVE_FILE))
                    .setAccessType("offline")
                    .build();

            // Set up local server receiver for authorization
            LocalServerReceiver receiver = new LocalServerReceiver.Builder()
                    .setPort(8888)
                    .build();

            // Authorize and get credentials
            Credential credential = new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");

            // Build Drive service
            driveService = new Drive.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    credential)
                    .setApplicationName("Store Management System")
                    .build();

            log.info("Google Drive service initialized successfully with OAuth 2.0");
        } catch (IOException | GeneralSecurityException e) {
            log.error("Failed to initialize Google Drive service", e);
        }
    }

    @Scheduled(fixedRate = 3600000) // Run every hour (3600000 ms = 1 hour)
    public void performAutomatedBackup() {
        if (!backupEnabled) {
            log.info("Automated backup is disabled");
            return;
        }

        try {
            log.info("Starting automated backup...");
            
            // Export data
            Map<String, Object> backupData = exportAllData();
            
            // Create backup file
            String fileName = createBackupFile(backupData);
            
            // Upload to Google Drive
            if (driveService != null && !folderId.isEmpty()) {
                uploadToGoogleDrive(fileName);
                log.info("Automated backup completed successfully and uploaded to Google Drive: {}", fileName);
            } else {
                log.info("Automated backup completed successfully (local only): {}", fileName);
            }
            
        } catch (Exception e) {
            log.error("Automated backup failed", e);
        }
    }

    public Map<String, Object> exportAllData() {
        List<CustomerDTO> customers = customerService.getAllCustomers();
        List<TransactionDTO> transactions = transactionService.getAllTransactions();

        // Calculate summary statistics
        double totalCredit = customers.stream()
                .mapToDouble(c -> c.getTotalCredit() != null ? c.getTotalCredit().doubleValue() : 0.0)
                .sum();
        double totalDebit = customers.stream()
                .mapToDouble(c -> c.getTotalDebit() != null ? c.getTotalDebit().doubleValue() : 0.0)
                .sum();
        double netBalance = totalCredit - totalDebit;
        long customersWithBalance = customers.stream()
                .filter(c -> c.getBalance() != null && c.getBalance().compareTo(java.math.BigDecimal.ZERO) > 0)
                .count();
        long customersInDebt = customers.stream()
                .filter(c -> c.getBalance() != null && c.getBalance().compareTo(java.math.BigDecimal.ZERO) < 0)
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCredit", totalCredit);
        summary.put("totalDebit", totalDebit);
        summary.put("netBalance", netBalance);
        summary.put("customersWithBalance", customersWithBalance);
        summary.put("customersInDebt", customersInDebt);

        Map<String, Object> backupData = new HashMap<>();
        backupData.put("customers", customers);
        backupData.put("transactions", transactions);
        backupData.put("exportDate", LocalDateTime.now().toString());
        backupData.put("version", "1.0");
        backupData.put("totalCustomers", customers.size());
        backupData.put("totalTransactions", transactions.size());
        backupData.put("summary", summary);

        return backupData;
    }

    private String createBackupFile(Map<String, Object> backupData) throws IOException {
        // Always use the same filename for backup
        String fileName = BACKUP_FILE_NAME;
        Path backupPath = Paths.get("backups", fileName);
        
        // Create backups directory if it doesn't exist
        Files.createDirectories(backupPath.getParent());
        
        // Write backup data to file
        String jsonData = objectMapper.writeValueAsString(backupData);
        Files.write(backupPath, jsonData.getBytes());
        
        log.info("Backup file created: {}", backupPath.toAbsolutePath());
        return backupPath.toString();
    }

    private void uploadToGoogleDrive(String filePath) throws IOException {
        if (driveService == null || folderId.isEmpty()) {
            throw new IllegalStateException("Google Drive service not initialized or folder ID not configured");
        }

        Path path = Paths.get(filePath);
        // Always use the constant backup file name
        String fileName = BACKUP_FILE_NAME;

        // Check if file already exists in Google Drive
        String existingFileId = findExistingFile(fileName);
        
        File fileMetadata = new File();
        fileMetadata.setName(fileName);
        fileMetadata.setParents(List.of(folderId));

        FileContent mediaContent = new FileContent("application/json", path.toFile());

        try {
            File uploadedFile;
            if (existingFileId != null) {
                // Update existing file
                uploadedFile = driveService.files().update(existingFileId, fileMetadata, mediaContent)
                        .setFields("id, name, size")
                        .execute();
                log.info("Updated existing file in Google Drive: {}", uploadedFile.getName());
            } else {
                // Create new file
                uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                        .setFields("id, name, size")
                        .execute();
                log.info("Uploaded new file to Google Drive: {}", uploadedFile.getName());
            }
        } catch (IOException e) {
            log.error("Failed to upload file to Google Drive", e);
            throw e;
        }
    }

    private String findExistingFile(String fileName) throws IOException {
        try {
            String query = String.format("name='%s' and '%s' in parents and trashed=false", fileName, folderId);
            var result = driveService.files().list()
                    .setQ(query)
                    .setSpaces("drive")
                    .setFields("files(id, name)")
                    .execute();

            if (!result.getFiles().isEmpty()) {
                return result.getFiles().get(0).getId();
            }
        } catch (IOException e) {
            log.warn("Error checking for existing file in Google Drive", e);
        }
        return null;
    }

    // Manual backup trigger
    public void triggerManualBackup() {
        log.info("Manual backup triggered");
        performAutomatedBackup();
    }

    // Google Drive backup trigger
    public void triggerGoogleDriveBackup() {
        log.info("Google Drive backup triggered");
        try {
            // Initialize Google Drive if needed
            initializeGoogleDriveIfNeeded();
            
            // Export data
            Map<String, Object> backupData = exportAllData();
            
            // Create backup file
            String fileName = createBackupFile(backupData);
            
            // Upload to Google Drive
            if (driveService != null && !folderId.isEmpty()) {
                uploadToGoogleDrive(fileName);
                log.info("Google Drive backup completed successfully: {}", fileName);
            } else {
                log.warn("Google Drive not configured, backup saved locally only: {}", fileName);
                // Don't throw exception, just log that it's local only
                log.info("Backup completed successfully (local only): {}", fileName);
            }
            
        } catch (IOException e) {
            log.error("Google Drive backup failed", e);
            throw new RuntimeException("Google Drive backup failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Google Drive backup failed", e);
            throw new RuntimeException("Google Drive backup failed: " + e.getMessage(), e);
        }
    }
} 