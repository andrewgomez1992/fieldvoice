import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import citywaterLogo from "../assets/citywater.png";

const Container = styled.div`
  position: relative;
  height: 100vh;
  /* 50/50 diagonal split */
  background: ${({ theme }) =>
    `linear-gradient(
       135deg,
       ${theme.colors.primary} 50%,
       ${theme.colors.backgroundAlt} 50%
     )`};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Card = styled(motion.div)`
  background: white;
  padding: 48px 32px;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 320px;
  text-align: center;
  z-index: 1; /* sit above the footer */
`;

const Logo = styled.img`
  width: 100px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0 0 24px;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(43, 108, 176, 0.2);
  }
`;

const Button = styled.button`
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
  &:active {
    transform: scale(0.98);
  }
`;

const Footer = styled.footer`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;

  p {
    margin: 0;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

export default function Landing() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/home");
  };

  return (
    <Container>
      <Card
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Logo src={citywaterLogo} alt="City Water Conservation" />
        <Title>Sign In</Title>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Username"
            value={username}
            required
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit">Log In</Button>
        </Form>
      </Card>

      <Footer>
        <p>
          © {new Date().getFullYear()} City Water Conservation. All rights
          reserved.
        </p>
      </Footer>
    </Container>
  );
}
