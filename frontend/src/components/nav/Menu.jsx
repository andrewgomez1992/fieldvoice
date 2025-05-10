import React, { useState } from "react";
import styled from "styled-components";
import {
  Menu as MenuIcon,
  X,
  Home,
  User,
  Bell,
  CreditCard,
  Settings as Gear,
  LogOut,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Dummy user
const DUMMY_USER = {
  name: "Drew Porterfield",
  avatar: "https://i.pravatar.cc/100",
};

const Wrapper = styled.div`
  position: relative;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  z-index: 20;
`;

const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  //   background: rgba(0, 0, 0, 0.3);
  z-index: 10;
`;

const Sidebar = styled(motion.nav)`
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background: #2d2d72;
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.2);
  z-index: 11;
  display: flex;
  flex-direction: column;
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
  overflow: hidden;
`;

const CloseButton = styled(IconButton)`
  align-self: flex-end;
  margin: 8px;
`;

const Profile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const Avatar = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid white;
  margin-bottom: 12px;
`;

const Name = styled.div`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
`;

const MenuList = styled.div`
  flex: 1;
  padding: 16px 0;
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: white;
  cursor: pointer;
  transition: background 0.1s;
  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
  }
`;

const Label = styled.span`
  margin-left: 16px;
  font-size: 1rem;
`;

export default function MenuButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const items = [
    { icon: Home, label: "Home", action: () => navigate("/home") },
    { icon: User, label: "Profile", action: () => navigate("/profile") },
    {
      icon: Bell,
      label: "Notifications",
      action: () => navigate("/view-reports"),
    },
    { icon: Gear, label: "Settings", action: () => navigate("/settings") },
    {
      icon: LogOut,
      label: "Sign Out",
      action: () => {
        /* TODO: clear auth, redirect */
      },
    },
  ];

  return (
    <Wrapper>
      <IconButton aria-label="Open menu" onClick={() => setOpen(true)}>
        <MenuIcon size={28} />
      </IconButton>

      <AnimatePresence>
        {open && (
          <>
            <Backdrop
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />

            <Sidebar
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <CloseButton
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X size={24} />
              </CloseButton>

              <Profile>
                <Avatar src={DUMMY_USER.avatar} alt={DUMMY_USER.name} />
                <Name>{DUMMY_USER.name}</Name>
              </Profile>

              <MenuList>
                {items.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <MenuItem
                      key={item.label}
                      onClick={() => {
                        item.action();
                        setOpen(false);
                      }}
                    >
                      <IconComp size={20} color="white" />
                      <Label>{item.label}</Label>
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Sidebar>
          </>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}
