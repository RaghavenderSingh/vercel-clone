import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tighter">
              Titan<span className="text-blue-500">.</span>
            </span>
          </Link>
          <DesktopNav />
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Log in
            </Button>
          </Link>
          <Link href="/signup" className="hidden md:block">
            <Button className="bg-white text-black hover:bg-gray-200">
              Sign Up
            </Button>
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function DesktopNav() {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-gray-400 hover:text-white focus:bg-transparent data-[state=open]:bg-transparent">Features</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-black border border-gray-800">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-blue-500/20 to-blue-500/5 p-6 no-underline outline-none focus:shadow-md"
                    href="/"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium text-white">
                      Deply Scale
                    </div>
                    <p className="text-sm leading-tight text-gray-400">
                      Zero-config deployment for global scaling.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <ListItem href="/features/analytics" title="Analytics">
                Real-time insights and usage metrics.
              </ListItem>
              <ListItem href="/features/edge" title="Edge Functions">
                Serverless compute at the edge.
              </ListItem>
              <ListItem href="/features/preview" title="Preview Deployments">
                Automatic previews for every PR.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/pricing" legacyBehavior passHref>
            <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "bg-transparent text-gray-400 hover:text-white focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent")}>
              Pricing
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/blog" legacyBehavior passHref>
            <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "bg-transparent text-gray-400 hover:text-white focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent")}>
              Blog
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-gray-400">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-black border-gray-800 text-white">
        <div className="flex flex-col space-y-4 mt-8">
          <Link href="/features" className="text-lg font-medium text-gray-400 hover:text-white">
            Features
          </Link>
           <Link href="/pricing" className="text-lg font-medium text-gray-400 hover:text-white">
            Pricing
          </Link>
           <Link href="/blog" className="text-lg font-medium text-gray-400 hover:text-white">
            Blog
          </Link>
          <div className="h-px bg-gray-800 my-4" />
          <Link href="/login">
             <Button variant="ghost" className="w-full justify-start text-gray-400">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button className="w-full bg-white text-black hover:bg-gray-200">Sign Up</Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const ListItem = ({ className, title, children, ...props }: any) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none text-white">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-gray-400">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
};
