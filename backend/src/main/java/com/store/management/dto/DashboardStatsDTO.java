package com.store.management.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private BigDecimal totalCredit;
    private BigDecimal totalDebit;
    private BigDecimal netBalance;
    private Long totalCustomers;
    private Long customersWithPositiveBalance;
    private Long customersWithNegativeBalance;
}
