package dev.joemoser.jwt_implementation.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="users")
public class User
{
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private String username;

    @Column(nullable=false)
    private String password;

    @Column
    private String roles;

    public User() {}

    public User(String username, String password) 
    {
        this.username = username;
        this.password = password;
    }

    public User(String username, String password, String roles)
    {
        this.username = username;
        this.password = password;
        this.roles = roles;
    }

    public void setId(Long id){this.id = id;}
    public void setUsername(String username){this.username = username;}
    public void setPassword(String password){this.password = password;}
    public void setRoles(String roles){this.roles = roles;}

    public Long getId(){return this.id;}
    public String getUsername(){return this.username;}
    public String getPassword(){return this.password;}
    public String getRoles(){return this.roles;}
}
