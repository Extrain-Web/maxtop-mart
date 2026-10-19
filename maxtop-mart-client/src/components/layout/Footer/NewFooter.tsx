"use client";

import React from 'react';
import Link from 'next/link';
import { 
    FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaPinterestP, 
    FaApple, FaGooglePlay, FaShieldAlt, FaTruck, FaLock, FaBell, FaTicketAlt, FaTag
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const NewFooter: React.FC = () => {
    return (
        <footer className="bg-[#111111] text-gray-300 pt-12 pb-6 text-sm font-sans">
            <div className="container mx-auto px-4 max-w-7xl">
                
                {/* Top Section - Links & App Download */}
                <div className="flex flex-wrap md:flex-nowrap justify-between gap-8 mb-10">
                    
                    {/* Company Info */}
                    <div className="w-full sm:w-1/4 md:w-1/6">
                        <h4 className="text-white font-bold mb-4 tracking-wide text-sm">Company info</h4>
                        <ul className="space-y-3 text-[13px]">
                            <li><Link href="/" className="hover:underline">About Maxtop Mart</Link></li>
                            <li><Link href="/" className="hover:underline">Affiliate & Influencer Program: Join to Earn</Link></li>
                            <li><Link href="/" className="hover:underline">Contact us</Link></li>
                            <li><Link href="/" className="hover:underline">Careers</Link></li>
                            <li><Link href="/" className="hover:underline">Press</Link></li>
                            <li><Link href="/" className="hover:underline">Maxtop Mart's Tree Planting Program</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="w-full sm:w-1/4 md:w-1/6">
                        <h4 className="text-white font-bold mb-4 tracking-wide text-sm">Customer service</h4>
                        <ul className="space-y-3 text-[13px]">
                            <li><Link href="/" className="hover:underline">Return and refund policy</Link></li>
                            <li><Link href="/" className="hover:underline">Intellectual property policy</Link></li>
                            <li><Link href="/" className="hover:underline">Shipping info</Link></li>
                            <li><Link href="/" className="hover:underline">Your Recalls and Product Safety Alerts</Link></li>
                            <li><Link href="/" className="hover:underline">Report suspicious activity</Link></li>
                        </ul>
                    </div>

                    {/* Help */}
                    <div className="w-full sm:w-1/4 md:w-1/6">
                        <h4 className="text-white font-bold mb-4 tracking-wide text-sm">Help</h4>
                        <ul className="space-y-3 text-[13px]">
                            <li><Link href="/" className="hover:underline">Support center & FAQ</Link></li>
                            <li><Link href="/" className="hover:underline">Safety center</Link></li>
                            <li><Link href="/" className="hover:underline">Maxtop Mart purchase protection</Link></li>
                            <li><Link href="/" className="hover:underline">Sitemap</Link></li>
                            <li><Link href="/" className="hover:underline">Partner with Maxtop Mart</Link></li>
                        </ul>
                    </div>

                    {/* Download App & Socials */}
                    <div className="w-full sm:w-full md:w-5/12 flex flex-col xl:flex-row gap-8">
                        <div className="flex-1">
                            <h4 className="text-white font-bold mb-4 tracking-wide text-sm">Download the Maxtop Mart App</h4>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[12px] mb-5">
                                <div className="flex items-center gap-1.5"><FaTag className="text-gray-400" /> Price-drop alerts</div>
                                <div className="flex items-center gap-1.5"><FaTruck className="text-gray-400" /> Track orders any time</div>
                                <div className="flex items-center gap-1.5"><FaLock className="text-gray-400" /> Faster & more secure checkout</div>
                                <div className="flex items-center gap-1.5"><FaBell className="text-gray-400" /> Low stock items alerts</div>
                                <div className="flex items-center gap-1.5"><FaShieldAlt className="text-gray-400" /> Exclusive offers</div>
                                <div className="flex items-center gap-1.5"><FaTicketAlt className="text-gray-400" /> Coupons & offers alerts</div>
                            </div>
                            
                            <div className="flex gap-3 mb-8">
                                <button className="flex items-center gap-2 bg-transparent border border-gray-500 rounded-full py-1.5 px-4 hover:bg-gray-800 transition">
                                    <FaApple size={22} className="text-white" />
                                    <div className="text-left flex flex-col leading-tight">
                                        <span className="text-[10px] text-gray-400">Download on the</span>
                                        <span className="text-[13px] font-bold text-white">App Store</span>
                                    </div>
                                </button>
                                <button className="flex items-center gap-2 bg-transparent border border-gray-500 rounded-full py-1.5 px-4 hover:bg-gray-800 transition">
                                    <FaGooglePlay size={20} className="text-white" />
                                    <div className="text-left flex flex-col leading-tight">
                                        <span className="text-[10px] text-gray-400">Get it on</span>
                                        <span className="text-[13px] font-bold text-white">Google Play</span>
                                    </div>
                                </button>
                            </div>

                            <div>
                                <h4 className="text-white font-bold mb-3 tracking-wide text-sm">Connect with Maxtop Mart</h4>
                                <div className="flex items-center gap-4 text-white text-lg">
                                    <a href="#" className="hover:text-gray-400"><FaInstagram /></a>
                                    <a href="#" className="hover:text-gray-400"><FaFacebookF /></a>
                                    <a href="#" className="hover:text-gray-400"><FaXTwitter /></a>
                                    <a href="#" className="hover:text-gray-400"><FaTiktok /></a>
                                    <a href="#" className="hover:text-gray-400"><FaYoutube /></a>
                                    <a href="#" className="hover:text-gray-400"><FaPinterestP /></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Section - Certifications & Payment Methods */}
                <div className="border-t border-gray-800 pt-8 pb-6 flex flex-wrap md:flex-nowrap justify-between gap-8">
                    
                    {/* Security certification */}
                    <div className="w-full md:w-1/3">
                        <h4 className="text-white font-bold mb-3 text-sm">Security certification</h4>
                        <div className="flex flex-wrap gap-2">
                            {/* Dummy visual blocks for security badges to mimic the image */}
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-black flex items-center h-6">TRUSTED</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-[#1A1F71] flex items-center h-6">VISA</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-black flex items-center gap-1 h-6">
                                <div className="w-2 h-2 rounded-full bg-[#EB001B]"></div> Mastercard
                            </div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-blue-600 flex items-center h-6">SafeKey</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-black flex items-center h-6"><FaShieldAlt className="text-yellow-500 mr-1"/> Norton</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-black flex items-center h-6">JCB</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-green-700 flex items-center h-6">AFWG</div>
                        </div>
                    </div>

                    {/* We accept */}
                    <div className="w-full md:w-2/3">
                        <h4 className="text-white font-bold mb-3 text-sm">We accept</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {/* Mimicking payment method icons */}
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-[#00457C] flex items-center h-6">PayPal</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-[#1A1F71] flex items-center h-6">VISA</div>
                            <div className="bg-white px-1.5 py-1 rounded flex items-center h-6 gap-0.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] -ml-1.5"></div>
                            </div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-blue-400 flex items-center h-6">AMEX</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-orange-500 flex items-center h-6">Discover</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold flex items-center h-6">Maestro</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-gray-800 flex items-center h-6">Diners</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-green-600 flex items-center h-6">JCB</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-blue-800 flex items-center h-6">CB</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-black flex items-center h-6"><FaApple className="mr-0.5"/>Pay</div>
                            <div className="bg-[#B2FCE4] px-1.5 py-1 rounded text-[10px] font-bold text-black flex items-center h-6">afterpay</div>
                            <div className="bg-[#FFB3C7] px-1.5 py-1 rounded text-[10px] font-bold text-black flex items-center h-6">Klarna.</div>
                            <div className="bg-[#4A47EB] px-1.5 py-1 rounded text-[10px] font-bold text-white flex items-center h-6">Affirm</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-gray-700 flex items-center h-6">G Pay</div>
                            {/* Adding BD options as well to fit context seamlessly */}
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-[#D12053] flex items-center h-6">bKash</div>
                            <div className="bg-white px-1.5 py-1 rounded text-[10px] font-bold text-[#F6921E] flex items-center h-6">Nagad</div>
                        </div>
                    </div>

                </div>

                {/* Copyright Section */}
                <div className="border-t border-gray-800 pt-6 flex items-center justify-center gap-6 text-[11px] text-gray-400">
                    <p>© 2022 - {new Date().getFullYear()} Maxtop Mart Inc.</p>
                    <Link href="/" className="hover:underline">Terms of use</Link>
                    <Link href="/" className="hover:underline">Privacy policy</Link>
                    <Link href="/" className="hover:underline flex items-center gap-1">
                        Your privacy choices <span className="bg-blue-600 text-white px-1 py-0.5 rounded-[2px] text-[8px] flex items-center"><FaShieldAlt size={8}/></span>
                    </Link>
                    <Link href="/" className="hover:underline">Ad Choices</Link>
                </div>
            </div>
        </footer>
    );
};

export default NewFooter;
