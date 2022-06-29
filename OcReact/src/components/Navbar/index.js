import React from "react";

import { Container, Navbar, Nav } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";

const NaviBar = () => {
  return (
    <Navbar expand="sm" bg="light" variant="light">
      <container>
        <Nav className="me-auto">
          <Nav.Link as={NavLink} to="posts">
            Posts
          </Nav.Link>
          <Nav.Link as={NavLink} to="new-post">
            Add a New Post
          </Nav.Link>
          <Nav.Link as={NavLink} to="users">
            Users
          </Nav.Link>
          <Nav.Link as={NavLink} to="new-user">
            Add a New User
          </Nav.Link>
          <Nav.Link as={NavLink} to="user-search">
            Search Users
          </Nav.Link>
          <Nav.Link as={NavLink} to="date-time-form">
            DateTime Form
          </Nav.Link>
        </Nav>
      </container>
    </Navbar>
  );
};

export default NaviBar;
