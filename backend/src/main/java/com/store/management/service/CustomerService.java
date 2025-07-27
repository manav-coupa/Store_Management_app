package com.store.management.service;

import com.store.management.dto.CustomerDTO;
import com.store.management.dto.DashboardStatsDTO;
import com.store.management.model.Customer;
import com.store.management.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {
    
    private final CustomerRepository customerRepository;
    
    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Optional<CustomerDTO> getCustomerById(Long id) {
        return customerRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    public Optional<CustomerDTO> getCustomerByMobile(String mobile) {
        return customerRepository.findByMobile(mobile)
                .map(this::convertToDTO);
    }
    
    public List<CustomerDTO> searchCustomers(String searchTerm) {
        return customerRepository.findByNameContainingIgnoreCaseOrMobileContaining(searchTerm, searchTerm)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public CustomerDTO createCustomer(CustomerDTO customerDTO) {
        Customer customer = new Customer();
        customer.setName(customerDTO.getName());
        customer.setMobile(customerDTO.getMobile());
        customer.setTotalCredit(BigDecimal.ZERO);
        customer.setTotalDebit(BigDecimal.ZERO);
        customer.setBalance(BigDecimal.ZERO);
        
        Customer savedCustomer = customerRepository.save(customer);
        return convertToDTO(savedCustomer);
    }
    
    @Transactional
    public CustomerDTO updateCustomer(Long id, CustomerDTO customerDTO) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        customer.setName(customerDTO.getName());
        customer.setMobile(customerDTO.getMobile());
        
        Customer savedCustomer = customerRepository.save(customer);
        return convertToDTO(savedCustomer);
    }
    
    @Transactional
    public void deleteCustomer(Long id) {
        customerRepository.deleteById(id);
    }
    
    @Transactional
    public void clearAllData() {
        customerRepository.deleteAll();
    }
    
    public List<CustomerDTO> getCustomersWithOutstandingBalance() {
        List<Customer> positiveBalance = customerRepository.findCustomersWithPositiveBalance();
        List<Customer> negativeBalance = customerRepository.findCustomersWithNegativeBalance();
        
        positiveBalance.addAll(negativeBalance);
        
        return positiveBalance.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public DashboardStatsDTO getDashboardStats() {
        BigDecimal totalCredit = customerRepository.getTotalCredit();
        BigDecimal totalDebit = customerRepository.getTotalDebit();
        Long totalCustomers = customerRepository.count();
        Long customersWithPositiveBalance = customerRepository.countCustomersWithPositiveBalance();
        Long customersWithNegativeBalance = customerRepository.countCustomersWithNegativeBalance();
        
        if (totalCredit == null) totalCredit = BigDecimal.ZERO;
        if (totalDebit == null) totalDebit = BigDecimal.ZERO;
        
        BigDecimal netBalance = totalCredit.subtract(totalDebit);
        
        return new DashboardStatsDTO(
                totalCredit,
                totalDebit,
                netBalance,
                totalCustomers,
                customersWithPositiveBalance,
                customersWithNegativeBalance
        );
    }
    
    private CustomerDTO convertToDTO(Customer customer) {
        return new CustomerDTO(
                customer.getId(),
                customer.getName(),
                customer.getMobile(),
                customer.getTotalCredit(),
                customer.getTotalDebit(),
                customer.getBalance(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }
}
