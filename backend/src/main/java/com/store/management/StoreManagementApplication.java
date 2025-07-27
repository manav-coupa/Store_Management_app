package com.store.management;

import com.store.management.service.BackupService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StoreManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(StoreManagementApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initializeBackupService(ApplicationReadyEvent event) {
        BackupService backupService = event.getApplicationContext().getBean(BackupService.class);
        backupService.initializeGoogleDrive();
    }
}
