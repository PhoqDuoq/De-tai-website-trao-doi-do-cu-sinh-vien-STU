package com.stu.marketplace.identity.security;

import com.stu.marketplace.identity.entity.AccountStatus;
import com.stu.marketplace.identity.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

@Getter
@AllArgsConstructor
@Builder
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String studentCode;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    private final AccountStatus accountStatus;

    public static UserPrincipal create(User user) {
        Collection<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getCode()))
                .collect(Collectors.toSet());

        return UserPrincipal.builder()
                .id(user.getId())
                .email(user.getEmail())
                .studentCode(user.getStudentCode())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .accountStatus(user.getAccountStatus())
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountStatus != AccountStatus.LOCKED && accountStatus != AccountStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return accountStatus == AccountStatus.ACTIVE;
    }
}
