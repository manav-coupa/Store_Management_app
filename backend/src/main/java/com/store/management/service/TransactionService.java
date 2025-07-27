package com.store.management.service;

import com.store.management.dto.TransactionDTO;
import com.store.management.model.Customer;
import com.store.management.model.Transaction;
import com.store.management.model.Transaction.TransactionType;
import com.store.management.repository.CustomerRepository;
import com.store.management.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {
    
    private final TransactionRepository transactionRepository;
    private final CustomerRepository customerRepository;
    
    @Transactional(readOnly = true)
    public List<TransactionDTO> getAllTransactions() {
        return transactionRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Optional<TransactionDTO> getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    @Transactional(readOnly = true)
    public List<TransactionDTO> getTransactionsByCustomerId(Long customerId) {
        return transactionRepository.findByCustomerIdOrderByTransactionDateDesc(customerId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TransactionDTO> getTransactionsByType(TransactionType type) {
        return transactionRepository.findByTypeOrderByTransactionDateDesc(type)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TransactionDTO> searchTransactions(String searchTerm, TransactionType type) {
        return transactionRepository.findTransactionsWithFilters(searchTerm, type)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public TransactionDTO createTransaction(TransactionDTO transactionDTO) {
        Customer customer = customerRepository.findById(transactionDTO.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        Transaction transaction = new Transaction();
        transaction.setCustomer(customer);
        transaction.setType(transactionDTO.getType());
        transaction.setAmount(transactionDTO.getAmount());
        transaction.setDescription(transactionDTO.getDescription());
        transaction.setTransactionDate(transactionDTO.getTransactionDate() != null ? 
                transactionDTO.getTransactionDate() : LocalDate.now());
        
        Transaction savedTransaction = transactionRepository.save(transaction);
        
        // Update customer totals
        updateCustomerTotals(customer);
        
        return convertToDTO(savedTransaction);
    }
    
    @Transactional
    public TransactionDTO updateTransaction(Long id, TransactionDTO transactionDTO) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        Customer oldCustomer = transaction.getCustomer();
        
        transaction.setType(transactionDTO.getType());
        transaction.setAmount(transactionDTO.getAmount());
        transaction.setDescription(transactionDTO.getDescription());
        transaction.setTransactionDate(transactionDTO.getTransactionDate());
        
        Transaction savedTransaction = transactionRepository.save(transaction);
        
        // Update customer totals
        updateCustomerTotals(oldCustomer);
        
        return convertToDTO(savedTransaction);
    }
    
    @Transactional
    public void deleteTransaction(Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        Customer customer = transaction.getCustomer();
        transactionRepository.deleteById(id);
        
        // Update customer totals after deletion
        updateCustomerTotals(customer);
    }
    
    @Transactional
    public void clearAllTransactions() {
        transactionRepository.deleteAll();
    }
    
    private void updateCustomerTotals(Customer customer) {
        List<Transaction> transactions = transactionRepository.findByCustomerIdOrderByTransactionDateDesc(customer.getId());
        
        BigDecimal totalCredit = transactions.stream()
                .filter(t -> t.getType() == TransactionType.CREDIT)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalDebit = transactions.stream()
                .filter(t -> t.getType() == TransactionType.DEBIT)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        customer.setTotalCredit(totalCredit);
        customer.setTotalDebit(totalDebit);
        customer.updateBalance();
        
        customerRepository.save(customer);
    }
    
    private TransactionDTO convertToDTO(Transaction transaction) {
        return new TransactionDTO(
                transaction.getId(),
                transaction.getCustomer().getId(),
                transaction.getCustomer().getName(),
                transaction.getCustomer().getMobile(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getDescription(),
                transaction.getTransactionDate(),
                transaction.getCreatedAt()
        );
    }
}
