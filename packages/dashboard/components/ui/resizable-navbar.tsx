"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  return (
    <motion.nav
      animate={{
        paddingTop: isScrolled ? "0.5rem" : "1.5rem",
        paddingBottom: isScrolled ? "0.5rem" : "1.5rem",
        backgroundColor: isScrolled ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0)",
        borderColor: isScrolled ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0)",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b",
        isScrolled ? "backdrop-blur-md" : "backdrop-blur-none border-transparent",
        className
      )}
    >
      <div className="container mx-auto px-4 md:px-8">
        {children}
      </div>
    </motion.nav>
  );
};

export const NavBody = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {children}
    </div>
  );
};

export const NavbarLogo = ({ className }: { className?: string }) => {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <span className="text-xl font-bold tracking-tighter text-white">
        Titan<span className="text-blue-500">.</span>
      </span>
    </Link>
  );
};

interface NavItemsProps {
  items: { name: string; link: string }[];
  className?: string;
}

export const NavItems = ({ items, className }: NavItemsProps) => {
  return (
    <div className={cn("hidden md:flex items-center gap-8", className)}>
      {items.map((item, idx) => (
        <Link
          key={idx}
          href={item.link}
          className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
};

interface NavbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export const NavbarButton = ({ variant = "primary", className, children, ...props }: NavbarButtonProps) => {
  if (variant === "secondary") {
    return (
      <Button variant="ghost" className={cn("text-gray-400 hover:text-white", className)} {...props}>
        {children}
      </Button>
    );
  }
  return (
    <Button className={cn("bg-white text-black hover:bg-gray-200", className)} {...props}>
      {children}
    </Button>
  );
};

export const MobileNav = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("md:hidden", className)}>{children}</div>;
};

export const MobileNavHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("flex items-center justify-between py-4 md:hidden", className)}>
      {children}
    </div>
  );
};

export const MobileNavToggle = ({ isOpen, onClick, className }: { isOpen: boolean; onClick: () => void; className?: string }) => {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} className={cn("text-gray-400", className)}>
      {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </Button>
  );
};

interface MobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const MobileNavMenu = ({ isOpen, onClose, children, className }: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn("overflow-hidden bg-black/95 backdrop-blur-xl border-b border-white/10", className)}
        >
          <div className="flex flex-col gap-6 p-6">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
