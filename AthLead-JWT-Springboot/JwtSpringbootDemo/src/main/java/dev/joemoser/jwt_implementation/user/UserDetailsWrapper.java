package dev.joemoser.jwt_implementation.user;

import java.util.Arrays;
import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class UserDetailsWrapper implements UserDetails
{
    private User user;

    public UserDetailsWrapper(User user)
    {
        this.user = user;
    }

    @Override
    public String getUsername(){return user.getUsername();}

    @Override
    public String getPassword(){return user.getPassword();}

    @Override
    public Collection<GrantedAuthority> getAuthorities()
    {
        return Arrays.stream(user.getRoles().split(","))
                            .map(String::trim)
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
    }
}