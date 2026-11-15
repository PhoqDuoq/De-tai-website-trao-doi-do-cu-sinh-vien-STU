package com.stu.marketplace.billing.repository;

import com.stu.marketplace.billing.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByGatewayTxnRef(String gatewayTxnRef);

    List<PaymentTransaction> findByInvoiceId(Long invoiceId);

    List<PaymentTransaction> findByInvoiceIdOrderByCreatedAtDesc(Long invoiceId);
}
