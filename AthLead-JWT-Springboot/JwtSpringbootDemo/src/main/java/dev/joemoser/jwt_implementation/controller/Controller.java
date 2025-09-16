package dev.joemoser.jwt_implementation.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import dev.joemoser.jwt_implementation.jwt.JwtUtils;
import dev.joemoser.jwt_implementation.user.User;
import dev.joemoser.jwt_implementation.user.UserDetailsWrapperService;
import dev.joemoser.jwt_implementation.user.UserRepository;

@RestController
public class Controller
{
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsWrapperService userDetailsWrapperService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/api/protected/home")
    public ResponseEntity<String> home()
    {
        return new ResponseEntity<>("Hello Home!", HttpStatus.OK);
    }

    @PostMapping("/api/public/register")
    public ResponseEntity<?> register(@RequestBody User user)
    {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok().body("User registered!");
    }

    @PostMapping("/api/public/login")
    public ResponseEntity<?> login(@RequestBody ReqObject reqObject)
    {
        try
        {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(reqObject.username, reqObject.password));
        }
        catch(BadCredentialsException bce)
        {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials!");
        }

        final UserDetails userDetails = userDetailsWrapperService.loadUserByUsername(reqObject.username);
        final String jwt = jwtUtils.generateToken(userDetails);

        return ResponseEntity.ok().body(jwt);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginRoot(@RequestBody ReqObject reqObject)
    {
        return login(reqObject);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerRoot(@RequestBody User user)
    {
        return register(user);
    }
}
