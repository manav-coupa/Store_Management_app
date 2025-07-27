package com.store.management.repository;

import com.store.management.model.Transaction;
import com.store.management.model.Transaction.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    List<Transaction> findByCustomerIdOrderByTransactionDateDesc(Long customerId);
    
    List<Transaction> findByTypeOrderByTransactionDateDesc(TransactionType type);
    
    List<Transaction> findByTransactionDateBetweenOrderByTransactionDateDesc(
        LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT t FROM Transaction t WHERE " +
           "(t.customer.name LIKE %:search% OR t.customer.mobile LIKE %:search%) " +
           "AND (:type IS NULL OR t.type = :type) " +
           "ORDER BY t.transactionDate DESC")
    List<Transaction> findTransactionsWithFilters(
        @Param("search") String search, 
        @Param("type") TransactionType type);
    
    @Query("SELECT t FROM Transaction t WHERE t.customer.id = :customerId " +
           "ORDER BY t.transactionDate DESC LIMIT 1")
    Transaction findLatestTransactionByCustomerId(@Param("customerId") Long customerId);
}
