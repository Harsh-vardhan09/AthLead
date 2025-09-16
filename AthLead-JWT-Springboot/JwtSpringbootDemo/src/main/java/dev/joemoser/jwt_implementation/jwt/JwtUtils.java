package dev.joemoser.jwt_implementation.jwt;

import java.util.Date;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

@Component
public class JwtUtils {

    private final String SECRET_KEY = "8f!Q#92hT@cLz*P0r7M$y1Nw&VsX3BkD";

    private Algorithm getAlgorithm() {
        return Algorithm.HMAC256(SECRET_KEY);
    }

    // Generate JWT token with roles as an array
    public String generateToken(UserDetails userDetails) {
        String[] roles = userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .toArray(String[]::new);

        return JWT.create()
                .withSubject(userDetails.getUsername())
                .withArrayClaim("roles", roles)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // 1 hour
                .sign(getAlgorithm());
    }

    public String extractUsername(String token) {
        return JWT.require(getAlgorithm())
                .build()
                .verify(token)
                .getSubject();
    }

    public List<String> extractRoles(String token) {
        return JWT.require(getAlgorithm())
                .build()
                .verify(token)
                .getClaim("roles")
                .asList(String.class);
    }

    public boolean validateToken(String token, String username) {
        try {
            DecodedJWT jwt = JWT.require(getAlgorithm()).build().verify(token);
            return jwt.getSubject().equals(username) && jwt.getExpiresAt().after(new Date());
        } catch (JWTVerificationException e) {
            return false;
        }
    }
}
