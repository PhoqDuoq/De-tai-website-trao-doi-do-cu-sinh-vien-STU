package com.stu.marketplace.billing.repository;

import com.stu.marketplace.billing.entity.Invoice;
import com.stu.marketplace.billing.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceCode(String invoiceCode);

    Page<Invoice> findByUserId(Long userId, Pageable pageable);

    Page<Invoice> findByListingId(Long listingId, Pageable pageable);

    Page<Invoice> findByStatus(InvoiceStatus status, Pageable pageable);

    boolean existsByInvoiceCode(String invoiceCode);
}
