package com.store.management.controller;

import com.store.management.dto.TransactionDTO;
import com.store.management.model.Transaction.TransactionType;
import com.store.management.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransactionController {
    
    private final TransactionService transactionService;
    
    @GetMapping
    public ResponseEntity<List<TransactionDTO>> getAllTransactions() {
        List<TransactionDTO> transactions = transactionService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TransactionDTO> getTransactionById(@PathVariable Long id) {
        return transactionService.getTransactionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<TransactionDTO>> getTransactionsByCustomerId(@PathVariable Long customerId) {
        List<TransactionDTO> transactions = transactionService.getTransactionsByCustomerId(customerId);
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<TransactionDTO>> getTransactionsByType(@PathVariable TransactionType type) {
        List<TransactionDTO> transactions = transactionService.getTransactionsByType(type);
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<TransactionDTO>> searchTransactions(
            @RequestParam(required = false) String term,
            @RequestParam(required = false) TransactionType type) {
        List<TransactionDTO> transactions = transactionService.searchTransactions(term, type);
        return ResponseEntity.ok(transactions);
    }
    
    @PostMapping
    public ResponseEntity<TransactionDTO> createTransaction(@RequestBody TransactionDTO transactionDTO) {
        try {
            TransactionDTO createdTransaction = transactionService.createTransaction(transactionDTO);
            return ResponseEntity.ok(createdTransaction);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TransactionDTO> updateTransaction(@PathVariable Long id, @RequestBody TransactionDTO transactionDTO) {
        try {
            TransactionDTO updatedTransaction = transactionService.updateTransaction(id, transactionDTO);
            return ResponseEntity.ok(updatedTransaction);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        try {
            transactionService.deleteTransaction(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllTransactions() {
        try {
            transactionService.clearAllTransactions();
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
