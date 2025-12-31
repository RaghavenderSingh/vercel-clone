import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black text-gray-400">
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6">
               <span className="text-2xl font-bold tracking-tighter text-white">
                Titan<span className="text-blue-500">.</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs mb-6">
              The platform for frontend developers. Build, deploy, and scale your apps with zero configuration.
            </p>
            <div className="flex space-x-4">
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Infrastructure</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Previews</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Edge Functions</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Analytics</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Guides</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
            </ul>
          </div>

          <div>
             <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-white/5" />

        <div className="flex flex-col md:flex-row justify-between items-center text-xs space-y-4 md:space-y-0">
          <div>
            &copy; {new Date().getFullYear()} Deply Inc. All rights reserved.
          </div>
          <div className="flex space-x-8">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
             <Link href="#" className="hover:text-white transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
