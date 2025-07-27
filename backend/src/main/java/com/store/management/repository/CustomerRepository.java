package com.store.management.repository;

import com.store.management.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    
    Optional<Customer> findByMobile(String mobile);
    
    List<Customer> findByNameContainingIgnoreCaseOrMobileContaining(String name, String mobile);
    
    @Query("SELECT c FROM Customer c WHERE c.balance > 0 ORDER BY c.balance DESC")
    List<Customer> findCustomersWithPositiveBalance();
    
    @Query("SELECT c FROM Customer c WHERE c.balance < 0 ORDER BY c.balance ASC")
    List<Customer> findCustomersWithNegativeBalance();
    
    @Query("SELECT SUM(c.totalCredit) FROM Customer c")
    BigDecimal getTotalCredit();
    
    @Query("SELECT SUM(c.totalDebit) FROM Customer c")
    BigDecimal getTotalDebit();
    
    @Query("SELECT COUNT(c) FROM Customer c WHERE c.balance > 0")
    Long countCustomersWithPositiveBalance();
    
    @Query("SELECT COUNT(c) FROM Customer c WHERE c.balance < 0")
    Long countCustomersWithNegativeBalance();
}
